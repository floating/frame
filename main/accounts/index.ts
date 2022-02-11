

import EventEmitter from 'events'
import fetch from 'node-fetch'
import log from 'electron-log'
import { shell, Notification } from 'electron'
import { addHexPrefix, intToHex} from 'ethereumjs-util'

import store from '../store'
import dataScanner from '../externalData'
import { getType as getSignerType } from '../signers/Signer'
import windows from '../windows'
import FrameAccount from './Account'
import { usesBaseFee, signerCompatibility, maxFee, TransactionData, SignerCompatibility } from '../transaction'
import { weiIntToEthInt, hexToInt } from '../../resources/utils'

import {
  AccountRequest, AccessRequest,
  TransactionRequest, TransactionReceipt,
  ReplacementType, RequestStatus, RequestMode
} from './types'

// Provider Proxy
import proxyProvider from'../provider/proxy'
import { Chain } from '../chains'
import { TypedData, Version } from 'eth-sig-util'

function notify (title: string, body: string, action: (event: Electron.Event) => void) {
  const notification = new Notification({ title, body })
  notification.on('click', action)

  setTimeout(() => notification.show(), 1000)
}

const accountsApi = {
  getAccounts: function () {
    return (store('main.accounts') || {}) as Record<string, Account>
  },
  getAccount: function (id: string) {
    return (store('main.accounts', id) || {}) as Account
  },
}

export { RequestMode, AccountRequest, AccessRequest, TransactionRequest, SignTypedDataRequest, SwitchChainRequest, AddChainRequest, AddTokenRequest } from './types'

export class Accounts extends EventEmitter {
  _current: string | null = ''
  accounts: Record<string, FrameAccount>

  constructor () {
    super()

    this.accounts = Object.entries(accountsApi.getAccounts()).reduce((accounts, [id, account]) => {
      accounts[id] = new FrameAccount(JSON.parse(JSON.stringify(account)), this)

      return accounts
    }, {} as Record<string, FrameAccount>)

    dataScanner.start()
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

  async add (address: Address, options = {}, cb: Callback<Account> = () => {}) {
    if (!address) return cb(new Error('No address, will not add account'))
    address = address.toLowerCase()
    const account = store('main.accounts', address)
    if (account) return cb(null, account) // Account already exists...
    log.info('Account not found, creating account')
    const created = 'new:' + Date.now()
    this.accounts[address] = new FrameAccount({ address, created, options }, this)
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

  removeRequestWarning (reqId: string) {
    log.info('removeRequestWarning: ', reqId)

    const currentAccount = this.current()
    if (currentAccount && currentAccount.requests[reqId]) {
      const txRequest = this.getTransactionRequest(currentAccount, reqId)
      delete txRequest.warning
      currentAccount.update()
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

      const tx = {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendTransaction',
        chainId: addHexPrefix(targetChain.id.toString(16)),
        params: [] as any[]
      }

      if (type === ReplacementType.Speed) {
        tx.params = [data]
      } else {
        tx.params = [{
          from: currentAccount.getSelectedAddress(),
          to: currentAccount.getSelectedAddress(),
          value: '0x0',
          nonce: data.nonce,
          chainId: addHexPrefix(targetChain.id.toString(16)),
          _origin: currentAccount.requests[id].origin
        }]
      }

      proxyProvider.emit('send', tx, (res: RPCResponsePayload) => {
        if (res.error) return reject(new Error(res.error.message))
        resolve()
      })
    })
  }

  private async confirmations (account: FrameAccount, id: string, hash: string, targetChain: Chain) {
    return new Promise<number>((resolve, reject) => {
      // TODO: Route to account even if it's not current
      if (!account) return reject(new Error('Unable to determine target account'))
      if (!targetChain || !targetChain.type || !targetChain.id) return reject(new Error('Unable to determine target chain'))
      const targetChainId = addHexPrefix(targetChain.id.toString(16))

      proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_blockNumber', chainId: targetChainId, params: [] }, (res: RPCResponsePayload) => {
        if (res.error) return reject(new Error(JSON.stringify(res.error)))

        proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_getTransactionReceipt', chainId: targetChainId, params: [hash] }, (receiptRes: RPCResponsePayload) => {
          if (receiptRes.error) return reject(receiptRes.error)

          if (receiptRes.result && account.requests[id]) {
            const txRequest = this.getTransactionRequest(account, id)

            txRequest.tx = { ...txRequest.tx, receipt: receiptRes.result, confirmations: txRequest.tx?.confirmations || 0 }

            account.update()

            if (!txRequest.feeAtTime) {
              const network = targetChain
              if (network.type === 'ethereum' && network.id === 1) {
                fetch('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=KU5RZ9156Q51F592A93RUKHW1HDBBUPX9W').then(res => res.json()).then((res: any) => {
                  if (res && res.message === 'OK' && res.result && res.result.ethusd && txRequest.tx && txRequest.tx.receipt) {
                    const { gasUsed } = txRequest.tx.receipt

                    txRequest.feeAtTime = (Math.round(weiIntToEthInt((hexToInt(gasUsed) * hexToInt(txRequest.data.gasPrice || '0x0')) * res.result.ethusd) * 100) / 100).toFixed(2)
                    account.update()
                  }
                }).catch(e => console.log('Unable to fetch exchange rate', e))
              } else {
                txRequest.feeAtTime = '?.??'
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
                shell.openExternal(explorer + '/tx/' + hash)
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
      proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads'], chainId: targetChainId }, (newHeadRes: RPCResponsePayload) => {
        if (newHeadRes.error) {
          log.warn(newHeadRes.error)
          const monitor = async () => {

            if (!account) return log.error('txMonitor internal monitor had no target account')

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
          const handler = async (payload: RPCRequestPayload) => {
            if (payload.method === 'eth_subscription' && (payload.params as any).subscription === headSub) {
              // const newHead = payload.params.result
              let confirmations
              try {
                confirmations = await this.confirmations(account, id, hash, targetChain)
              } catch (e) {
                log.error(e)
                // proxyProvider.removeListener('data', handler)
                proxyProvider.off(`data:${targetChain.type}:${targetChain.id}`, handler)
                setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 60 * 1000)
                return
              }

              txRequest.tx = { ...txRequest.tx, confirmations }
              account.update()

              if (confirmations > 12) {
                txRequest.status = RequestStatus.Confirmed
                txRequest.notice = 'Confirmed'
                account.update()
                setTimeout(() => this.accounts[account.address] && this.removeRequest(account, id), 8000)
                // proxyProvider.removeListener('data', handler)
                
                proxyProvider.off(`data:${targetChain.type}:${targetChain.id}`, handler)
                proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_unsubscribe', chainId: targetChainId, params: [headSub] }, (res: RPCResponsePayload) => {
                  if (res.error) {
                    log.error('error sending message eth_unsubscribe', res)
                  }
                })
              }
            }
          }
          proxyProvider.on(`data:${targetChain.type}:${targetChain.id}`, handler)
        }
      })
    }
  }

  // Set Current Account
  setSigner (id: string, cb: Callback<Account>) {
    this._current = id
    const currentAccount = this.current()

    if (!currentAccount) {
      const err = new Error('could not set signer')
      log.error(`no current account with id: ${id}`, err.stack)

      return cb(err)
    }

    dataScanner.setActiveAddress(currentAccount.address)

    const summary = currentAccount.summary()
    cb(null, summary)
    
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
        .filter(([_, req]) => !req.locked && !req.feesUpdatedByUser && (!chainId || parseInt(req.data.chainId, 16) === chainId))

      transactions.forEach(([id, req]) => {
        const tx = req.data
        const chain = { type: 'ethereum', id: parseInt(tx.chainId, 16) }
        const gas = store('main.networksMeta', chain.type, chain.id, 'gas')

        if (usesBaseFee(tx)) {
          const { maxBaseFeePerGas, maxPriorityFeePerGas } = gas.price.fees
          this.setPriorityFee(maxPriorityFeePerGas, id, false, e => { if (e) log.error(e) })
          this.setBaseFee(maxBaseFeePerGas, id, false, e => { if (e) log.error(e) })
        } else {
          const gasPrice = gas.price.levels.fast
          this.setGasPrice(gasPrice, id, false, e => { if (e) log.error(e) })
        }
      })
    }
  }

  unsetSigner (cb: Callback<{ id: string, status: string }>) {
    this._current = null

    dataScanner.setActiveAddress('')

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

    if (signer.status === 'locked') return cb(new Error('Signer locked'))

    const data = this.getTransactionRequest(currentAccount, handlerId).data
    cb(null, signerCompatibility(data, signer.summary()))
  }

  close () {
    dataScanner.stop()
    dataScanner.kill()
    // usbDetect.stopMonitoring()
  }

  setAccess (req: AccessRequest, access: boolean) {
    const currentAccount = this.current()
    if (currentAccount) {
      currentAccount.setAccess(req, access)
    }
  }

  resolveRequest (req: AccountRequest) {
    const currentAccount = this.current()
    if (currentAccount && currentAccount.resolveRequest) {
      currentAccount.resolveRequest(req)
    }
  }

  addRequest (req: AccountRequest, res?: RPCCallback<any>) {
    log.info('addRequest', JSON.stringify(req))

    const currentAccount = this.current()
    if (currentAccount && !currentAccount.requests[req.handlerId]) {
      currentAccount.addRequest(req, res)
    }
  }

  removeRequest (account: FrameAccount, handlerId: string) {
    log.debug(`removeRequest(${account.id}, ${handlerId})`)

    delete account.requests[handlerId]
    account.update()
  }

  declineRequest (handlerId: string) {
    const currentAccount = this.current()

    if (currentAccount && currentAccount.requests[handlerId]) {
      const txRequest = this.getTransactionRequest(currentAccount, handlerId)

      txRequest.status = RequestStatus.Error
      txRequest.notice = 'Signature Declined'
      txRequest.mode = RequestMode.Monitor

      setTimeout(() => this.accounts[currentAccount.address] && this.removeRequest(currentAccount, handlerId), 8000)
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

  private completeTxFeeUpdate (currentAccount: FrameAccount, handlerId: string, userUpdate: boolean, previousFee: any, cb: Callback<void>) {
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

    cb(null)
  }

  setBaseFee (baseFee: string, handlerId: string, userUpdate: boolean, cb: Callback<void>) {
    try {
      const { currentAccount, maxPriorityFeePerGas, gasLimit, currentBaseFee, txType } = this.txFeeUpdate(baseFee, handlerId, userUpdate)
      
      // New value
      const newBaseFee = parseInt(this.limitedHexValue(baseFee, 0, 9999 * 1e9), 16)

      // No change
      if (newBaseFee === currentBaseFee) return cb(null)

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

      this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, previousFee, cb)
    } catch (e) {
      cb(e as Error)
    }
  }

  setPriorityFee (priorityFee: string, handlerId: string, userUpdate: boolean, cb: Callback<void>) {
    try {
      const { currentAccount, maxPriorityFeePerGas, gasLimit, currentBaseFee, txType } = this.txFeeUpdate(priorityFee, handlerId, userUpdate)
      
      // New values
      const newMaxPriorityFeePerGas = parseInt(this.limitedHexValue(priorityFee, 0, 9999 * 1e9), 16)

      // No change
      if (newMaxPriorityFeePerGas === maxPriorityFeePerGas) return cb(null)

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
      this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, previousFee, cb)
    } catch (e) {
      cb(e as Error)
    }
  }

  setGasPrice (price: string, handlerId: string, userUpdate: boolean, cb: Callback<void>) {
    try {
      const { currentAccount, gasLimit, gasPrice, txType } = this.txFeeUpdate(price, handlerId, userUpdate)

      // New values
      const newGasPrice = parseInt(this.limitedHexValue(price, 0, 9999 * 1e9), 16)

      // No change
      if (newGasPrice === gasPrice) return cb(null)

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
      this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, previousFee, cb)
    } catch (e) {
      cb(e as Error)
    }
  }

  setGasLimit (limit: string, handlerId: string, userUpdate: boolean, cb: Callback<void>) {
    try {
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
      this.completeTxFeeUpdate(currentAccount, handlerId, userUpdate, false, cb)
    } catch (e) {
      cb(e as Error)
    }
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
    if (txRequest && txRequest.type === 'transaction') {
      const nonce = txRequest.data && txRequest.data.nonce
      if (nonce) {
        const adjustedNonce = intToHex(parseInt(nonce, 16) + nonceAdjust)

        txRequest.data.nonce = adjustedNonce
        currentAccount.update()
      } else {
        const { from, chainId } = txRequest.data

        proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', chainId, params: [from, 'pending'] }, (res: RPCResponsePayload) => {
          if (res.result) {
            const newNonce = parseInt(res.result, 16)
            const adjustedNonce = intToHex(nonceAdjust === 1 ? newNonce : newNonce + nonceAdjust)

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

  stopExternalDataScan () {
    dataScanner.stop()
  }

  // removeAllAccounts () {
  //   windows.broadcast('main:action', 'unsetSigner')
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
