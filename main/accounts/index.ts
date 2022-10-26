import EventEmitter from 'events'
import log from 'electron-log'
import { shell, Notification } from 'electron'
import { addHexPrefix, intToHex} from 'ethereumjs-util'
import { TypedData, Version } from 'eth-sig-util'
import { v5 as uuidv5 } from 'uuid'

import store from '../store'
import ExternalDataScanner, { DataScanner } from '../externalData'
import { getType as getSignerType } from '../signers/Signer'
import FrameAccount from './Account'
import { usesBaseFee, TransactionData, GasFeesSource } from '../../resources/domain/transaction'
import { signerCompatibility, maxFee, SignerCompatibility } from '../transaction'
import { weiIntToEthInt, hexToInt } from '../../resources/utils'
import provider from '../provider'
import { Chain } from '../chains'
import { ApprovalType } from '../../resources/constants'
import {
  AccountRequest, AccessRequest,
  TransactionRequest, TransactionReceipt,
  ReplacementType, RequestStatus, RequestMode
} from './types'

function notify (title: string, body: string, action: (event: Electron.Event) => void) {
  const notification = new Notification({ title, body })
  notification.on('click', action)

  setTimeout(() => notification.show(), 1000)
}

const frameOriginId = uuidv5('frame-internal', uuidv5.DNS)

const accountsApi = {
  getAccounts: function () {
    return (store('main.accounts') || {}) as Record<string, Account>
  },
  getAccount: function (id: string) {
    return (store('main.accounts', id) || {}) as Account
  },
}

export { RequestMode, AccountRequest, AccessRequest, TransactionRequest, SignTypedDataRequest, AddChainRequest, AddTokenRequest } from './types'

export class Accounts extends EventEmitter {
  _current: string
  accounts: Record<string, FrameAccount>

  private readonly dataScanner: DataScanner

  constructor () {
    super()

    this.accounts = Object.entries(accountsApi.getAccounts()).reduce((accounts, [id, account]) => {
      accounts[id] = new FrameAccount(JSON.parse(JSON.stringify(account)), this)

      return accounts
    }, {} as Record<string, FrameAccount>)

    this._current = Object.values(this.accounts).find(acct => acct.active)?.id || ''

    this.dataScanner = ExternalDataScanner()
  }

  get (id: string) {
    return this.accounts[id] && this.accounts[id].summary()
  }

  private getTransactionRequest (account: FrameAccount, id: string): TransactionRequest {
    return account.getRequest(id)
  }

  // Public
  addAragon (account: Account, cb: Callback<Account>) {
    const existing = accountsApi.getAccount(account.address)
    if (existing.id) return cb(null, existing) // Account already exists

    log.info('Aragon account not found, creating account')

    const accountOpts = {
      ...account,
      lastSignerType: getSignerType(account.lastSignerType),
      options: { type: 'aragon' }
    }

    this.accounts[account.address] = new FrameAccount(accountOpts, this)

    cb(null, this.accounts[account.address].summary())
  }

  async add (address: Address, name = '', options = {}, cb: Callback<FrameAccount> = () => {}) {
    if (!address) return cb(new Error('No address, will not add account'))
    address = address.toLowerCase()

    let account = store('main.accounts', address)
    if (!account) {
      log.info(`Account ${address} not found, creating account`)

      const created = 'new:' + Date.now()

      this.accounts[address] = new FrameAccount({ address, name, created, options, active: false }, this)
      account = this.accounts[address]
    }

    return cb(null, account)
  }

  rename (id: string, name: string) {
    this.accounts[id].rename(name)
  }

  update (account: Account) {
    store.updateAccount(account)
  }

  current () {
    return this._current ? this.accounts[this._current] : null
  }

  updateNonce (reqId: string, nonce: string) {
    log.info('Update Nonce: ', reqId, nonce)

    const currentAccount = this.current()

    if (currentAccount) {
      const txRequest = this.getTransactionRequest(currentAccount, reqId)

      txRequest.data.nonce = nonce
      currentAccount.update()

      return txRequest
    }
  }

  confirmRequestApproval (reqId: string, approvalType: ApprovalType, approvalData: any) {
    log.info('confirmRequestApproval', reqId, approvalType)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[reqId]) {
      const txRequest = this.getTransactionRequest(currentAccount, reqId)

      const approval = (txRequest.approvals || []).find(a => a.type === approvalType)

      if (approval) {
        approval.approve(approvalData)
      }
    }
  }

  async replaceTx (id: string, type: ReplacementType) {
    const currentAccount = this.current()

    return new Promise<void>((resolve, reject) => {
      if (!currentAccount || !currentAccount.requests[id]) return reject(new Error('Could not find request'))
      if (currentAccount.requests[id].type !== 'transaction') return reject(new Error('Request is not transaction'))

      const txRequest = this.getTransactionRequest(currentAccount, id)

      const data = JSON.parse(JSON.stringify(txRequest.data))
      const targetChain = { type: 'ethereum', id: parseInt(data.chainId, 16)}
      const { levels } = store('main.networksMeta', targetChain.type, targetChain.id, 'gas.price')

      // Set the gas default to asap
      store.setGasDefault(targetChain.type, targetChain.id, 'asap', levels.asap)

      const params = type === ReplacementType.Speed
        ? [data]
        : [{
          from: currentAccount.getSelectedAddress(),
          to: currentAccount.getSelectedAddress(),
          value: '0x0',
          nonce: data.nonce,
          chainId: addHexPrefix(targetChain.id.toString(16)),
          _origin: currentAccount.requests[id].origin
        }]

      const tx = {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendTransaction',
        chainId: addHexPrefix(targetChain.id.toString(16)),
        params
      }

      this.sendRequest(tx, (res: RPCResponsePayload) => {
        if (res.error) return reject(new Error(res.error.message))
        resolve()
      })
    })
  }

  private sendRequest (payload: { method: string, params: any[], chainId: string }, cb: RPCRequestCallback) {
    provider.send({ id: 1, jsonrpc: '2.0', ...payload, _origin: frameOriginId }, cb)
  }

  private async confirmations (account: FrameAccount, id: string, hash: string, targetChain: Chain) {
    return new Promise<number>((resolve, reject) => {
      // TODO: Route to account even if it's not current
      if (!account) return reject(new Error('Unable to determine target account'))
      if (!targetChain || !targetChain.type || !targetChain.id) return reject(new Error('Unable to determine target chain'))
      const targetChainId = addHexPrefix(targetChain.id.toString(16))

      this.sendRequest({ method: 'eth_blockNumber', params: [], chainId: targetChainId }, (res: RPCResponsePayload) => {
        if (res.error) return reject(new Error(JSON.stringify(res.error)))

        this.sendRequest({ method: 'eth_getTransactionReceipt', params: [hash], chainId: targetChainId }, (receiptRes: RPCResponsePayload) => {
          if (receiptRes.error) return reject(receiptRes.error)
          if (!this.accounts[account.address]) return reject(new Error('account closed'))

          if (receiptRes.result && account.requests[id]) {
            const txRequest = this.getTransactionRequest(account, id)

            txRequest.tx = { ...txRequest.tx, receipt: receiptRes.result, confirmations: txRequest.tx?.confirmations || 0 }

            account.update()

            if (!txRequest.feeAtTime) {
              const network = targetChain
              if (network.type === 'ethereum' && network.id === 1) {
                const ethPrice = store('main.networksMeta.ethereum.1.nativeCurrency.usd.price')

                if (ethPrice && txRequest.tx && txRequest.tx.receipt && this.accounts[account.address]) {
                  const { gasUsed } = txRequest.tx.receipt

                  txRequest.feeAtTime = (Math.round(weiIntToEthInt((hexToInt(gasUsed) * hexToInt(txRequest.data.gasPrice || '0x0')) * res.result.ethusd) * 100) / 100).toFixed(2)
                  account.update()
                }
              } else {
                txRequest.feeAtTime = '?'
                account.update()
              }
            }

            if (receiptRes.result.status === '0x1' && txRequest.status === RequestStatus.Verifying) {
              txRequest.status = RequestStatus.Confirming
              txRequest.notice = 'Confirming'
              txRequest.completed = Date.now()
              const hash = txRequest.tx.hash || ''
              const h = hash.substring(0, 6) + '...' + hash.substring(hash.length - 4)
              const body = `Transaction ${h} successful! \n Click for details`

              // Drop any other pending txs with same nonce
              Object.keys(account.requests).forEach(k => {
                const txReq = this.getTransactionRequest(account, k)
                if (txReq.status === RequestStatus.Verifying && txReq.data.nonce === (account.requests[id] as TransactionRequest).data.nonce) {
                  txReq.status = RequestStatus.Error
                  txReq.notice = 'Dropped'
                  setTimeout(() => this.accounts[account.address] && this.removeRequest(account, k), 8000)
                }
              })

              // If Frame is hidden, trigger native notification
              notify('Transaction Successful', body, () => {
                const { type, id } = targetChain
                const explorer = store('main.networks', type, id, 'explorer')

                if (explorer) {
                  shell.openExternal(explorer + '/tx/' + hash)
                }
              })
            }
            const blockHeight = parseInt(res.result, 16)
            const receiptBlock = parseInt((txRequest.tx.receipt as TransactionReceipt).blockNumber, 16)
            resolve(blockHeight - receiptBlock)
          }
        })
      })
    })
  }

  private async txMonitor (account: FrameAccount, id: string, hash: string) {
    if (!account) return log.error('txMonitor had no target account')

    const txRequest = this.getTransactionRequest(account, id)
    const rawTx = txRequest.data
    txRequest.tx = { hash, confirmations: 0 }

    account.update()

    if (!rawTx.chainId) {
      log.error('txMonitor had no target chain')
      setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 8 * 1000)
    } else {
      const targetChain: Chain = {
        type: 'ethereum',
        id: parseInt(rawTx.chainId, 16)
      }

      const targetChainId = addHexPrefix(targetChain.id.toString(16))
      this.sendRequest({ method: 'eth_subscribe', params: ['newHeads'], chainId: targetChainId }, (newHeadRes: RPCResponsePayload) => {
        if (newHeadRes.error) {
          log.warn(newHeadRes.error)
          const monitor = async () => {
            if (!this.accounts[account.address]) {
              clearTimeout(monitorTimer)
              return log.error('txMonitor internal monitor had no target account')
            }

            let confirmations
            try {
              confirmations = await this.confirmations(account, id, hash, targetChain)
              txRequest.tx = { ...txRequest.tx, confirmations }

              account.update()

              if (confirmations > 12) {
                txRequest.status = RequestStatus.Confirmed
                txRequest.notice = 'Confirmed'
                account.update()
                setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 8000)
                clearTimeout(monitorTimer)
              }
            } catch (e) {
              log.error('error awaiting confirmations', e)
              clearTimeout(monitorTimer)
              setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 60 * 1000)
              return
            }
          }
          setTimeout(() => monitor(), 3000)
          const monitorTimer = setInterval(monitor, 15000)
        } else if (newHeadRes.result) {
          const headSub = newHeadRes.result

          const removeSubscription = async (requestRemoveTimeout: number) => {
            setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), requestRemoveTimeout)
            provider.off(`data:${targetChain.type}:${targetChain.id}`, handler)
            this.sendRequest({ method: 'eth_unsubscribe', chainId: targetChainId, params: [headSub] }, (res: RPCResponsePayload) => {
              if (res.error) {
                log.error('error sending message eth_unsubscribe', res)
              }
            })
          }

          const handler = async (payload: RPCRequestPayload) => {
            if (payload.method === 'eth_subscription' && (payload.params as any).subscription === headSub) {
              // const newHead = payload.params.result
              let confirmations
              try {
                confirmations = await this.confirmations(account, id, hash, targetChain)
              } catch (e) {
                log.error(e)

                return removeSubscription(60 * 1000)
              }

              txRequest.tx = { ...txRequest.tx, confirmations }
              account.update()

              if (confirmations > 12) {
                txRequest.status = RequestStatus.Confirmed
                txRequest.notice = 'Confirmed'
                account.update()
                
                removeSubscription(8000)
              }
            }
          }

          provider.on(`data:${targetChain.type}:${targetChain.id}`, handler)
          // provider.on('data', ({ type, id }, ...args) => {
          //   if (id === targetChain.id) {
          //     handler(args)
          //   }
          // })
        }
      })
    }
  }

  // Set Current Account
  setSigner (id: string, cb: Callback<Account>) {
    const previouslyActiveAccount = this.current()

    this._current = id
    const currentAccount = this.current()

    if (!currentAccount) {
      const err = new Error('could not set signer')
      log.error(`no current account with id: ${id}`, err.stack)

      return cb(err)
    }

    currentAccount.active = true
    currentAccount.update()

    const summary = currentAccount.summary()
    cb(null, summary)

    if (previouslyActiveAccount && previouslyActiveAccount.address !== currentAccount.address) {
      previouslyActiveAccount.active = false
      previouslyActiveAccount.update()
    }
    
    store.setAccount(summary)

    if (currentAccount.status === 'ok') this.verifyAddress(false, (err, verified) => {
      if (!err && !verified) {
        currentAccount.signer = ''
        currentAccount.update()
      }
    })

    // If the account has any current requests, make sure fees are current
    this.updatePendingFees()
  }

  updatePendingFees (chainId?: number) {
    const currentAccount = this.current()

    if (currentAccount) {
      // If chainId, update pending tx requests from that chain, otherwise update all pending tx requests
      const transactions = Object.entries(currentAccount.requests)
        .filter(([_, req]) => req.type === 'transaction')
        .map(([_, req]) => [_, req] as [string, TransactionRequest])
        .filter(([_, req]) => 
          !req.locked &&
          !req.feesUpdatedByUser &&
          req.data.gasFeesSource === GasFeesSource.Frame &&
          (!chainId || parseInt(req.data.chainId, 16) === chainId))

      transactions.forEach(([id, req]) => {
        try {
          const tx = req.data
          const chain = { type: 'ethereum', id: parseInt(tx.chainId, 16) }
          const gas = store('main.networksMeta', chain.type, chain.id, 'gas')

          if (usesBaseFee(tx)) {
            const { maxBaseFeePerGas, maxPriorityFeePerGas } = gas.price.fees
            this.setPriorityFee(maxPriorityFeePerGas, id, false)
            this.setBaseFee(maxBaseFeePerGas, id, false)
          } else {
            const gasPrice = gas.price.levels.fast
            this.setGasPrice(gasPrice, id, false)
          }
        } catch (e) {
          log.error('Could not update gas fees for transaction', e)
        }
      })
    }
  }

  unsetSigner (cb: Callback<{ id: string, status: string }>) {
    const summary = { id: '', status: '' }
    if (cb) cb(null, summary)

    store.unsetAccount()


    // setTimeout(() => { // Clear signer requests when unset
    //   if (s) {
    //     s.requests = {}
    //     s.update()
    //   }
    // })
  }

  verifyAddress (display: boolean, cb: Callback<boolean>) {
    const currentAccount = this.current()
    if (currentAccount && currentAccount.verifyAddress) currentAccount.verifyAddress(display, cb)
  }

  getSelectedAddresses () {
    const currentAccount = this.current()
    return currentAccount ? currentAccount.getSelectedAddresses() : []
  }

  getAccounts (cb?: Callback<Array<string>>) {
    const currentAccount = this.current()
    if (!currentAccount) {
      if (cb) cb(new Error('No Account Selected'))
      return
    }

    return currentAccount.getAccounts(cb)
  }

  getCoinbase (cb: Callback<Array<string>>) {
    const currentAccount = this.current()

    if (!currentAccount) return cb(new Error('No Account Selected'))

    currentAccount.getCoinbase(cb)
  }

  signMessage (address: Address, message: string, cb: Callback<string>) {
    const currentAccount = this.current()

    if (!currentAccount) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== currentAccount.getSelectedAddress().toLowerCase()) return cb(new Error('signMessage: Wrong Account Selected'))

    currentAccount.signMessage(message, cb)
  }

  signTypedData (version: Version, address: Address, typedData: TypedData, cb: Callback<string>) {
    const currentAccount = this.current()

    if (!currentAccount) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== currentAccount.getSelectedAddress().toLowerCase()) return cb(new Error('signMessage: Wrong Account Selected'))

    currentAccount.signTypedData(version, typedData, cb)
  }

  signTransaction (rawTx: TransactionData, cb: Callback<string>) {
    const currentAccount = this.current()

    if (!currentAccount) return cb(new Error('No Account Selected'))

    const matchSelected = (rawTx.from || '').toLowerCase() === currentAccount.getSelectedAddress().toLowerCase()
    const matchActor = (rawTx.from || '').toLowerCase() === (currentAccount.smart ? currentAccount.smart.actor.toLowerCase() : false)
    
    if (matchSelected || matchActor) {
      currentAccount.signTransaction(rawTx, cb)
    } else {
      cb(new Error('signMessage: Account does not match currently selected'))
    }
  }

  signerCompatibility (handlerId: string, cb: Callback<SignerCompatibility>) {
    const currentAccount = this.current()
    if (!currentAccount) return cb(new Error('Could not locate account'))

    const request = currentAccount.requests[handlerId] && currentAccount.requests[handlerId].type === 'transaction'
    if (!request) return cb(new Error(`Could not locate request ${handlerId}`))

    const signer = currentAccount.getSigner()
    if (!signer) return cb(new Error('No signer'))

    if (signer.status === 'locked') {
      const crumb = {
        view: 'expandedSigner', 
        data: { signer: signer.id }
      }
      store.navDash(crumb)
      return cb(new Error('Signer locked'))
    }

    const data = this.getTransactionRequest(currentAccount, handlerId).data
    cb(null, signerCompatibility(data, signer.summary()))
  }

  close () {
    this.dataScanner.close()
    // usbDetect.stopMonitoring()
  }

  setAccess (req: AccessRequest, access: boolean) {
    const currentAccount = this.current()
    if (currentAccount) {
      currentAccount.setAccess(req, access)
    }
  }

  resolveRequest <T> (req: AccountRequest, result?: T) {
    const currentAccount = this.current()
    if (currentAccount && currentAccount.resolveRequest) {
      currentAccount.resolveRequest(req, result)
    }
  }

  rejectRequest (req: AccountRequest, error: EVMError) {
    const currentAccount = this.current()
    if (currentAccount) {
      currentAccount.rejectRequest(req, error)
    }
  }

  addRequest (req: AccountRequest, res?: RPCCallback<any>) {
    log.info('addRequest', JSON.stringify(req))

    const currentAccount = this.current()
    if (currentAccount && !currentAccount.requests[req.handlerId]) {
      currentAccount.addRequest(req, res)
    }
  }

  removeRequests (handlerId: string) {
    Object.values(this.accounts).forEach((account) => {
      if (account.requests[handlerId]) {
        this.removeRequest(account, handlerId)
      }
    })
  }

  removeRequest (account: FrameAccount, handlerId: string) {
    log.info(`removeRequest(${account.id}, ${handlerId})`)

    store.navClearReq(handlerId)

    delete account.requests[handlerId]
    account.update()
  }

  declineRequest (handlerId: string) {
    const currentAccount = this.current()

    if (currentAccount && currentAccount.requests[handlerId]) {
      const txRequest = this.getTransactionRequest(currentAccount, handlerId)

      txRequest.status = RequestStatus.Declined
      txRequest.notice = 'Signature Declined'
      txRequest.mode = RequestMode.Monitor

      setTimeout(() => this.accounts[currentAccount.address] && this.removeRequest(currentAccount, handlerId), 2000)
      currentAccount.update()
    }
  }

  setRequestPending (req: AccountRequest) {
    const handlerId = req.handlerId
    const currentAccount = this.current()
    
    log.info('setRequestPending', handlerId)

    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = RequestStatus.Pending
      currentAccount.requests[handlerId].notice = 'See Signer'
      currentAccount.update()
    }
  }

  setRequestError (handlerId: string, err: Error) {
    log.info('setRequestError', handlerId)

    const currentAccount = this.current()

    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = RequestStatus.Error

      if (err.message === 'Ledger device: Invalid data received (0x6a80)') {
        currentAccount.requests[handlerId].notice = 'Ledger Contract Data = No'
      } else if (err.message === 'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)') {
        currentAccount.requests[handlerId].notice = 'Ledger Signature Declined'
      } else {
        const notice = err && typeof err === 'string' ? err : err && typeof err === 'object' && err.message && typeof err.message === 'string' ? err.message : 'Unknown Error' // TODO: Update to normalize input type
        currentAccount.requests[handlerId].notice = notice
      }
      if (currentAccount.requests[handlerId].type === 'transaction') {
        setTimeout(() => {
          const activeAccount = this.current()
          if (activeAccount && activeAccount.requests[handlerId]) {
            activeAccount.requests[handlerId].mode = RequestMode.Monitor
            activeAccount.update()
            
            setTimeout(() => this.accounts[activeAccount.address] && this.removeRequest(activeAccount, handlerId), 8000)
          }
        }, 1500)
      } else {
        setTimeout(() => this.accounts[currentAccount.address] && this.removeRequest(currentAccount, handlerId), 3300)
      }

      currentAccount.update()
    }
  }

  setTxSigned (handlerId: string, cb: Callback<void>) {
    log.info('setTxSigned', handlerId)

    const currentAccount = this.current()
    if (!currentAccount) return cb(new Error('No account selected'))

    if (currentAccount.requests[handlerId]) {
      if (currentAccount.requests[handlerId].status === RequestStatus.Declined || currentAccount.requests[handlerId].status === RequestStatus.Error) {
        cb(new Error('Request already declined'))
      } else {
        currentAccount.requests[handlerId].status = RequestStatus.Sending
        currentAccount.requests[handlerId].notice = 'Sending'
        currentAccount.update()
        cb(null)
      }
    } else {
      cb(new Error('No valid request for ' + handlerId))
    }
  }

  setTxSent (handlerId: string, hash: string) {
    log.info('setTxSent', handlerId, 'Hash', hash)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = RequestStatus.Verifying
      currentAccount.requests[handlerId].notice = 'Verifying'
      currentAccount.requests[handlerId].mode = RequestMode.Monitor
      currentAccount.update()

      this.txMonitor(currentAccount, handlerId, hash)
    }
  }

  setRequestSuccess (handlerId: string) {
    log.info('setRequestSuccess', handlerId)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[handlerId]) {
      currentAccount.requests[handlerId].status = RequestStatus.Success
      currentAccount.requests[handlerId].notice = 'Successful'
      if (currentAccount.requests[handlerId].type === 'transaction') {
        currentAccount.requests[handlerId].mode = RequestMode.Monitor
      } else {
        setTimeout(() => this.accounts[currentAccount.address] && this.removeRequest(currentAccount, handlerId), 3300)
      }

      currentAccount.update()
    }
  }

  remove (address = '') {
    address = address.toLowerCase()

    const currentAccount = this.current()
    if (currentAccount && currentAccount.address === address) {
      store.unsetAccount()

      const defaultAccount = (Object.values(this.accounts).filter(a => a.address !== address) || [])[0]
      if (defaultAccount) {
        this._current = defaultAccount.id
        defaultAccount.active = true
        defaultAccount.update()
      }
    }

    if (this.accounts[address]) this.accounts[address].close()

    store.removeAccount(address)
    delete this.accounts[address]
  }

  private invalidValue (fee: string) {
    return (!fee || isNaN(parseInt(fee, 16)) || parseInt(fee, 16) < 0)
  }

  private limitedHexValue (hexValue: string, min: number, max: number) {
    const value = parseInt(hexValue, 16)
    if (value < min) return intToHex(min)
    if (value > max) return intToHex(max)
    return hexValue
  }

  private txFeeUpdate (inputValue: string, handlerId: string, userUpdate: boolean) {
    // Check value
    if (this.invalidValue(inputValue)) throw new Error('txFeeUpdate, invalid input value')

    // Get current account
    const currentAccount = this.current()
    if (!currentAccount) throw new Error('No account selected while setting base fee')

    const request = this.getTransactionRequest(currentAccount, handlerId)
    if (!request || request.type !== 'transaction') throw new Error(`Could not find transaction request with handlerId ${handlerId}`)
    if (request.locked) throw new Error('Request has already been approved by the user')
    if (request.feesUpdatedByUser && !userUpdate) throw new Error('Fee has been updated by user')

    const tx = request.data
    const gasLimit = parseInt(tx.gasLimit || '0x0', 16)
    const txType = tx.type

    if (usesBaseFee(tx)) {
      const maxFeePerGas = parseInt(tx.maxFeePerGas || '0x0', 16)
      const maxPriorityFeePerGas = parseInt(tx.maxPriorityFeePerGas || '0x0', 16)
      const currentBaseFee = maxFeePerGas - maxPriorityFeePerGas
      return { currentAccount, inputValue, maxFeePerGas, maxPriorityFeePerGas, gasLimit, currentBaseFee, txType, gasPrice: 0 }
    } else {
      const gasPrice = parseInt(tx.gasPrice || '0x0', 16)
      return { currentAccount, inputValue, gasPrice, gasLimit, txType, currentBaseFee: 0, maxPriorityFeePerGas: 0, maxFeePerGas: 0 }
    }
  }

  private completeTxFeeUpdate (currentAccount: FrameAccount, handlerId: string, userUpdate: boolean, previousFee: any) {
    const txRequest = this.getTransactionRequest(currentAccount, handlerId)

    if (userUpdate) {
      txRequest.feesUpdatedByUser = true
      delete txRequest.automaticFeeUpdateNotice
    } else {
      if (!txRequest.automaticFeeUpdateNotice && previousFee) {
        txRequest.automaticFeeUpdateNotice = { previousFee }
      }
    }

    currentAccount.update()
  }

  setBaseFee (baseFee: string, handlerId: string, userUpdate: boolean) {
    const { currentAccount, maxPriorityFeePerGas, gasLimit, currentBaseFee, txType } = this.txFeeUpdate(baseFee, handlerId, userUpdate)

    // New value
    const newBaseFee = parseInt(this.limitedHexValue(baseFee, 0, 9999 * 1e9), 16)

    // No change
    if (newBaseFee === currentBaseFee) return

    const txRequest = this.getTransactionRequest(currentAccount, handlerId)
    const tx = txRequest.data

    // New max fee per gas
    const newMaxFeePerGas = newBaseFee + maxPriorityFeePerGas
    const maxTotalFee = maxFee(tx)

    // Limit max fee
    if (newMaxFeePerGas * gasLimit > maxTotalFee) {
      tx.maxFeePerGas = intToHex(Math.floor(maxTotalFee / gasLimit))
    } else {
      tx.maxFeePerGas = intToHex(newMaxFeePerGas)
    }

    // Complete update
    const previousFee = { type: txType, baseFee: intToHex(currentBaseFee), priorityFee: intToHex(maxPriorityFeePerGas) }

    this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, previousFee)
  }

  setPriorityFee (priorityFee: string, handlerId: string, userUpdate: boolean) {
    const { currentAccount, maxPriorityFeePerGas, gasLimit, currentBaseFee, txType } = this.txFeeUpdate(priorityFee, handlerId, userUpdate)
    
    // New values
    const newMaxPriorityFeePerGas = parseInt(this.limitedHexValue(priorityFee, 0, 9999 * 1e9), 16)

    // No change
    if (newMaxPriorityFeePerGas === maxPriorityFeePerGas) return

    const tx = this.getTransactionRequest(currentAccount, handlerId).data

    // New max fee per gas
    const newMaxFeePerGas = currentBaseFee + newMaxPriorityFeePerGas
    const maxTotalFee = maxFee(tx)
  
    // Limit max fee
    if (newMaxFeePerGas * gasLimit > maxTotalFee) {
      const limitedMaxFeePerGas = Math.floor(maxTotalFee / gasLimit)
      const limitedMaxPriorityFeePerGas = limitedMaxFeePerGas - currentBaseFee
      tx.maxPriorityFeePerGas = intToHex(limitedMaxPriorityFeePerGas)
      tx.maxFeePerGas = intToHex(limitedMaxFeePerGas)
    } else {
      tx.maxFeePerGas = intToHex(newMaxFeePerGas)
      tx.maxPriorityFeePerGas = intToHex(newMaxPriorityFeePerGas)
    }
  
    const previousFee = { 
      type: txType, 
      baseFee: intToHex(currentBaseFee),
      priorityFee: intToHex(maxPriorityFeePerGas)
    }

    // Complete update
    this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, previousFee)
  }

  setGasPrice (price: string, handlerId: string, userUpdate: boolean) {
    const { currentAccount, gasLimit, gasPrice, txType } = this.txFeeUpdate(price, handlerId, userUpdate)

    // New values
    const newGasPrice = parseInt(this.limitedHexValue(price, 0, 9999 * 1e9), 16)

    // No change
    if (newGasPrice === gasPrice) return

    const txRequest = this.getTransactionRequest(currentAccount, handlerId)
    const tx = txRequest.data
    const maxTotalFee = maxFee(tx)

    // Limit max fee
    if (newGasPrice * gasLimit > maxTotalFee) {
      tx.gasPrice = intToHex(Math.floor(maxTotalFee / gasLimit))
    } else {
      tx.gasPrice = intToHex(newGasPrice)
    }

    const previousFee = {
      type: txType, 
      gasPrice: intToHex(gasPrice)
    }

    // Complete update
    this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, previousFee)
  }

  setGasLimit (limit: string, handlerId: string, userUpdate: boolean) {
    const { currentAccount, maxFeePerGas, gasPrice, txType } = this.txFeeUpdate(limit, handlerId, userUpdate)
    
    // New values
    const newGasLimit = parseInt(this.limitedHexValue(limit, 0, 12.5e6), 16)

    const txRequest = this.getTransactionRequest(currentAccount, handlerId)
    const tx = txRequest.data
    const maxTotalFee = maxFee(tx)

    const fee = txType === '0x2' ? maxFeePerGas : gasPrice
    if (newGasLimit * fee > maxTotalFee) {
      tx.gasLimit = intToHex(Math.floor(maxTotalFee / fee))
    } else {
      tx.gasLimit = intToHex(newGasLimit)
    }

    // Complete update
    this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, false)
  }

  removeFeeUpdateNotice (handlerId: string, cb: Callback<void>) {
    const currentAccount = this.current()
    if (!currentAccount) return cb(new Error('No account selected while removing fee notice'))

    const txRequest = this.getTransactionRequest(currentAccount, handlerId)
    if (!txRequest) return cb(new Error(`Could not find request ${handlerId}`))

    delete txRequest.automaticFeeUpdateNotice
    currentAccount.update()

    cb(null)
  }

  adjustNonce (handlerId: string, nonceAdjust: number) {
    const currentAccount = this.current()

    if (nonceAdjust !== 1 && nonceAdjust !== -1) return log.error('Invalid nonce adjustment', nonceAdjust)
    if (!currentAccount) return log.error('No account selected during nonce adjustement', nonceAdjust)

    const txRequest = this.getTransactionRequest(currentAccount, handlerId)

    txRequest.data = Object.assign({}, txRequest.data)

    if (txRequest && txRequest.type === 'transaction') {
      const nonce = txRequest.data && txRequest.data.nonce
      if (nonce) {
        let updatedNonce = parseInt(nonce, 16) + nonceAdjust
        if (updatedNonce < 0) updatedNonce = 0
        const adjustedNonce = intToHex(updatedNonce)

        txRequest.data.nonce = adjustedNonce
        currentAccount.update()
      } else {
        const { from, chainId } = txRequest.data
        this.sendRequest({ method: 'eth_getTransactionCount', chainId, params: [from, 'pending'] }, (res: RPCResponsePayload) => {
          if (res.result) {
            const newNonce = parseInt(res.result, 16)
            let updatedNonce = nonceAdjust === 1 ? newNonce : newNonce + nonceAdjust
            if (updatedNonce < 0) updatedNonce = 0
            const adjustedNonce = intToHex(updatedNonce)
            txRequest.data.nonce = adjustedNonce
            currentAccount.update()
          }
        })
      }
    }
  }

  lockRequest (handlerId: string) {
    // When a request is approved, lock it so that no automatic updates such as fee changes can happen
    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[handlerId]) {
      (currentAccount.requests[handlerId] as TransactionRequest).locked = true
    } else {
      log.error('Trying to lock request ' + handlerId + ' but there is no current account')
    }
  }

  // removeAllAccounts () {
  //   setTimeout(() => {
  //     Object.keys(this.accounts).forEach(id => {
  //       if (this.accounts[id]) this.accounts[id].close()
  //       store.removeAccount(id)
  //       delete this.accounts[id]
  //     })
  //   }, 1000)
  // }
}

export default new Accounts()
