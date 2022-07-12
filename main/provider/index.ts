// @ts-ignore
import { v4 as uuid } from 'uuid'
import EventEmitter from 'events'
import log from 'electron-log'
import utils from 'web3-utils'
import { recoverTypedMessage, Version } from 'eth-sig-util'
import crypto from 'crypto'

import {
  padToEven,
  unpadHexString,
  addHexPrefix,
  stripHexPrefix,
  intToHex,
  isHexString,
  isHexPrefixed,
  fromUtf8,
  toBuffer,
  pubToAddress,
  ecrecover,
  hashPersonalMessage,
} from 'ethereumjs-util'

import store from '../store'
import protectedMethods from '../api/protectedMethods'
import packageFile from '../../package.json'

import proxyConnection from './proxy'
import accounts, { AccountRequest, TransactionRequest, SignTypedDataRequest, SwitchChainRequest, AddChainRequest, AddTokenRequest } from '../accounts'
import Chains, { Chain } from '../chains'
import { getType as getSignerType, Type as SignerType } from '../signers/Signer'
import { getAddress, TransactionData, usesBaseFee } from '../../resources/domain/transaction'
import { populate as populateTransaction, maxFee } from '../transaction'
import FrameAccount from '../accounts/Account'
import { capitalize, arraysMatch } from '../../resources/utils'
import { ApprovalType } from '../../resources/constants'

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'

const permission = (date: number, method: string) => ({ parentCapability: method, date })

type Subscriptions = { [key in SubscriptionType]: string[] }
type Balance = Token & { balance: string, displayBalance: string }

interface RequiredApproval {
  type: ApprovalType,
  data: any
}

export interface TransactionMetadata {
  tx: TransactionData,
  approvals: RequiredApproval[]
}

function isScanning (account: Address) {
  const lastUpdated = store('main.accounts', account, 'balances.lastUpdated') as number
  return !lastUpdated || (new Date().getTime() - lastUpdated) > (1000 * 60 * 5)
}

function getNativeCurrency (chainId: number) {
  const currency = store('main.networksMeta.ethereum', chainId, 'nativeCurrency')

  return (currency || { usd: { price: 0 } }) as Currency
}

function getRate (address: Address) {
  const rate = store('main.rates', address.toLowerCase())

  return (rate || { usd: { price: 0 } }) as Rate
}

function loadAssets (accountId: string) {
  const balances: Balance[] = store('main.balances', accountId) || []

  const response = { nativeCurrency: [] as RPC.GetAssets.NativeCurrency[], erc20: [] as RPC.GetAssets.Erc20[] }

  return balances.reduce((assets, balance) => {
    if (balance.address === NATIVE_CURRENCY) {
      const currency = getNativeCurrency(balance.chainId)

      assets.nativeCurrency.push({
        ...balance,
        currencyInfo: currency
      })
    } else {
      const { usd } = getRate(balance.address)

      assets.erc20.push({
        ...balance,
        tokenInfo: {
          lastKnownPrice: { usd }
        }
      })
    }

    return assets
  }, response)
}

export class Provider extends EventEmitter {
  connected = false
  connection = Chains

  handlers: { [id: string]: any } = {}
  subscriptions: Subscriptions = {
    accountsChanged: [],
    assetsChanged: [],
    chainChanged: [],
    chainsChanged: [], 
    networkChanged: []
  }

  store: (...args: any) => any

  constructor () {
    super()
    this.store = store
    
    this.connection.syncDataEmit(this)

    this.connection.on('connect', () => {
      this.connected = true
      this.emit('connect')
    })

    this.connection.on('close', () => { this.connected = false })
    this.connection.on('data', data => this.emit('data', data))

    this.connection.on('error', err => log.error(err))

    this.connection.on('update', event => {
      if (event.type === 'fees') {
        return accounts.updatePendingFees(event.chainId)
      }
    })

    proxyConnection.on('provider:send', (payload: RPCRequestPayload) => {
      const { id, method } = payload
      this.send(payload, ({ error, result }) => {
        proxyConnection.emit('payload', { id, method, error, result })
      })
    })

    this.getNonce = this.getNonce.bind(this)
  }

  accountsChanged (accounts: string[]) {
    this.subscriptions.accountsChanged.forEach(subscription => {
      this.emit('data:address', accounts[0], { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: accounts } })
    })
  }

  assetsChanged (account: string, assets: RPC.GetAssets.Assets) {
    this.subscriptions.assetsChanged.forEach(subscription => {
      this.emit('data:address', account, { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: { ...assets, account } } })
    })
  }

  // fires when the current default chain changes
  chainChanged (chainId: number) {
    const chain = intToHex(chainId)

    this.subscriptions.chainChanged.forEach(subscription => {
      this.emit('data', { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: chain } })
    })
  }

  // fires when the list of available chains changes
  chainsChanged (availableChains: number[]) {
    const chains = availableChains.map(intToHex)

    this.subscriptions.chainsChanged.forEach(subscription => {
      this.emit('data', { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: chains } })
    })
  }

  networkChanged (netId: number | string) {
    this.subscriptions.networkChanged.forEach(subscription => {
      this.emit('data', { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: netId } })
    })
  }

  getCoinbase (payload: RPCRequestPayload, res: RPCRequestCallback) {
    accounts.getAccounts((err, accounts) => {
      if (err) return this.resError(`signTransaction Error: ${JSON.stringify(err)}`, payload, res)
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: (accounts || [])[0] })
    })
  }

  getAccounts (payload: JSONRPCRequestPayload, res: RPCRequestCallback) {
    res({ id: payload.id, jsonrpc: payload.jsonrpc, result: accounts.getSelectedAddresses().map(a => a.toLowerCase()) })
  }

  getNetVersion (payload: JSONRPCRequestPayload, res: RPCRequestCallback, targetChain: Chain) {
    const { type, id } = (targetChain || store('main.currentNetwork'))

    const connection = this.connection.connections[type][id]
    const chainConnected = (connection?.primary?.connected || connection?.secondary?.connected)

    const response = chainConnected
      ? { result: id.toString() }
      : { error: { message: 'not connected', code: 1 } }

    res({ id: payload.id, jsonrpc: payload.jsonrpc, ...response })
  }

  getChainId (payload: JSONRPCRequestPayload, res: RPCSuccessCallback, targetChain: Chain) {
    const { type, id } = (targetChain || store('main.currentNetwork'))

    const connection = this.connection.connections[type][id]
    const chainConnected = (connection?.primary?.connected || connection?.secondary?.connected)

    const response = chainConnected
      ? { result: intToHex(id) }
      : { error: { message: 'not connected', code: 1 } }

    res({ id: payload.id, jsonrpc: payload.jsonrpc, ...response })
  }

  getChains (payload: JSONRPCRequestPayload, res: RPCSuccessCallback) {
    res({ id: payload.id, jsonrpc: payload.jsonrpc, result: getActiveChains().map(intToHex) })
  }

  declineRequest (req: AccountRequest) {
    const res = (data: any) => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    const payload = req.payload
    this.resError({ message: 'User declined transaction', code: 4001 }, payload, res)
  }

  resError (errorData: string | EVMError, request: RPCId, res: RPCErrorCallback) {
    const error = (typeof errorData === 'string')
      ? { message: errorData, code: -1 }
      : { message: errorData.message, code: errorData.code || -1 }

    log.warn(error)
    res({ id: request.id, jsonrpc: request.jsonrpc, error })
  }

  getSignedAddress (signed: string, message: string, cb: Callback<String>) {
    const signature = Buffer.from(signed.replace('0x', ''), 'hex')
    if (signature.length !== 65) cb(new Error('Frame verifySignature: Signature has incorrect length'))
    let v = signature[64]
    v = v === 0 || v === 1 ? v + 27 : v
    const r = toBuffer(signature.slice(0, 32))
    const s = toBuffer(signature.slice(32, 64))
    const hash = hashPersonalMessage(toBuffer(message))
    const verifiedAddress = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
    cb(null, verifiedAddress)
  }

  ecRecover (payload: JSONRPCRequestPayload, res: RPCRequestCallback) {
    const message = payload.params[0]
    const signed = payload.params[1]
    this.getSignedAddress(signed, message, (err, verifiedAddress) => {
      if (err) return this.resError(err.message, payload, res)
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: verifiedAddress })
    })
  }

  verifySignature (signed: string, message: string, address: string, cb: Callback<boolean>) {
    if (signed.length === 134) { // Aragon smart signed message
      try {
        signed = '0x' + signed.substring(4)

        const currentAccount = accounts.current()
        if (!currentAccount) return cb(new Error('no account selected'))

        const actor = (currentAccount.smart && currentAccount.smart.actor) || ''
        address = accounts.get(actor).address
      } catch (e) {
        return cb(new Error('Could not resolve message or actor for smart accoount'))
      }
    }

    this.getSignedAddress(signed, message, (err, verifiedAddress) => {
      if (err) return cb(err)
      if ((verifiedAddress || '').toLowerCase() !== address.toLowerCase()) return cb(new Error('Frame verifySignature: Failed ecRecover check'))
      cb(null, true)
    })
  }

  approveSign (req: AccountRequest, cb: Callback<string>) {
    const res = (data: any) => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    const payload = req.payload
    let [address, rawMessage] = payload.params

    let message = rawMessage

    if (isHexString(rawMessage)) {
      if (!isHexPrefixed(rawMessage)) {
        message = addHexPrefix(rawMessage)
      }
    } else {
      message = fromUtf8(rawMessage)
    }

    accounts.signMessage(address, message, (err, signed) => {
      if (err) {
        this.resError(err.message, payload, res)
        cb(err, undefined)
      } else {
        const signature = signed || ''
        this.verifySignature(signature, message, address, err => {
          if (err) {
            this.resError(err.message, payload, res)
            cb(err)
          } else {
            res({ id: payload.id, jsonrpc: payload.jsonrpc, result: signature })
            cb(null, signature)
          }
        })
      }
    })
  }

  approveSignTypedData (req: SignTypedDataRequest, cb: Callback<string>) {
    const res = (data: any) => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    const payload = req.payload
    const [address, data] = payload.params

    const dataToSign = (Array.isArray(data)) ? [...data] : { ...data }

    accounts.signTypedData(req.version, address, dataToSign, (err, signature) => {
      if (err) {
        this.resError(err.message, payload, res)
        cb(err)
      } else {
        const sig = signature || ''
        try {
          const recoveredAddress = recoverTypedMessage({ data, sig }, req.version)
          if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            throw new Error('TypedData signature verification failed')
          }

          res({ id: payload.id, jsonrpc: payload.jsonrpc, result: sig })
          cb(null, sig)
        } catch (e: unknown) {
          const err = e as Error
          this.resError(err.message, payload, res)

          cb(err)
        }
      }
    })
  }

  feeTotalOverMax (rawTx: TransactionData, maxTotalFee: number) {
    const maxFeePerGas = usesBaseFee(rawTx) ? parseInt(rawTx.maxFeePerGas || '', 16) : parseInt(rawTx.gasPrice || '', 16)
    const gasLimit = parseInt(rawTx.gasLimit || '', 16)
    const totalFee = maxFeePerGas * gasLimit
    return totalFee > maxTotalFee
  }

  signAndSend (req: TransactionRequest, cb: Callback<string>) {
    const rawTx = req.data
    const res = (data: any) => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    const payload = req.payload
    const maxTotalFee = maxFee(rawTx)

    if (this.feeTotalOverMax(rawTx, maxTotalFee)) {
      const chainId = parseInt(rawTx.chainId)
      const symbol = store(`main.networks.ethereum.${chainId}.symbol`)
      const displayAmount = symbol
        ? ` (${Math.floor(maxTotalFee / 1e18)} ${symbol})`
        : ''

      const err = `Max fee is over hard limit${displayAmount}`

      this.resError(err, payload, res)
      cb(new Error(err))
    } else {
      accounts.signTransaction(rawTx, (err, signedTx) => { // Sign Transaction
        if (err) {
          this.resError(err, payload, res)
          cb(err)
        } else {
          accounts.setTxSigned(req.handlerId, err => {
            if (err) return cb(err)
            let done = false
            const cast = () => {
              this.connection.send({
                id: req.payload.id,
                jsonrpc: req.payload.jsonrpc,
                method: 'eth_sendRawTransaction',
                params: [signedTx]
              }, response => {
                clearInterval(broadcastTimer)
                if (done) return
                done = true
                if (response.error) {
                  this.resError(response.error, payload, res)
                  cb(new Error(response.error.message))
                } else {
                  res(response)
                  cb(null, response.result)
                }
              }, {
                type: 'ethereum',
                id: parseInt(req.data.chainId, 16)
              })
            }
            const broadcastTimer = setInterval(() => cast(), 1000)
            cast()
          })
        }
      })
    }
  }

  approveTransactionRequest (req: TransactionRequest, cb: Callback<string>) {
    log.info('approveRequest', req)

    accounts.lockRequest(req.handlerId)
    if (req.data.nonce) return this.signAndSend(req, cb)
    this.getNonce(req.data, response => {
      if (response.error) {
        if (this.handlers[req.handlerId]) {
          this.handlers[req.handlerId](response)
          delete this.handlers[req.handlerId]
        }

        return cb(new Error(response.error.message))
      }

      const updatedReq = accounts.updateNonce(req.handlerId, response.result)

      if (updatedReq) {
        this.signAndSend(updatedReq, cb)
      } else {
        log.error(`could not find request with handlerId="${req.handlerId}"`)
        cb(new Error('could not find request'))
      }
    })
  }

  private getRawTx (newTx: RPC.SendTransaction.TxParams): TransactionData {
    const { gas, gasLimit, gasPrice, data, value, type, to, ...rawTx } = newTx
    const parsedValue = !value || parseInt(value, 16) === 0 ? '0x0' : addHexPrefix(unpadHexString(value) || '0')

    const tx: TransactionData = {
      ...rawTx,
      from: rawTx.from || ((accounts.current() || {}).id),
      type: '0x0',
      value: parsedValue,
      data: addHexPrefix(padToEven(stripHexPrefix(data || '0x'))),
      gasLimit: gasLimit || gas,
      chainId: rawTx.chainId || utils.toHex(store('main.currentNetwork.id'))
    }

    if (to) {
      tx.to = getAddress(to)
    }

    return tx
  }

  private addRequestHandler (res: RPCRequestCallback) {
    const handlerId: string = uuid()
    this.handlers[handlerId] = res

    return handlerId
  }
  
  private async getGasEstimate (rawTx: TransactionData) {
    const { from, to, value, data, nonce } = rawTx
    const txParams = { from, to, value, data, nonce }

    const payload: JSONRPCRequestPayload = { method: 'eth_estimateGas', params: [txParams], jsonrpc: '2.0', id: 1 }
    const targetChain: Chain = {
      type: 'ethereum',
      id: parseInt(rawTx.chainId, 16)
    }

    return new Promise<string>((resolve, reject) => {
      this.connection.send(payload, response => {
        if (response.error) {
          log.warn(`error estimating gas for tx to ${txParams.to}: ${response.error}`)
          return reject(response.error)
        }

        const estimatedLimit = parseInt(response.result, 16)
        const paddedLimit = Math.ceil(estimatedLimit * 1.5)

        log.verbose(`gas estimate for tx to ${txParams.to}: ${estimatedLimit}, using ${paddedLimit} as gas limit`)
        return resolve(addHexPrefix(paddedLimit.toString(16)))
      }, targetChain)
    })
  }

  private isCurrentAccount (address: string, account = accounts.current()) {
    const accountToCheck = account || accounts.current() || { id: '' }
    return address && (accountToCheck.id.toLowerCase() === address.toLowerCase())
  }

  private gasFees (rawTx: TransactionData) {
    return store('main.networksMeta', 'ethereum', parseInt(rawTx.chainId, 16), 'gas')
  }

  getNonce (rawTx: TransactionData, res: RPCRequestCallback) {
    const targetChain: Chain = {
      type: 'ethereum',
      id: (rawTx && rawTx.chainId) ? parseInt(rawTx.chainId, 16) : store('main.currentNetwork.id')
    }

    this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [rawTx.from, 'pending'] }, res, targetChain)
  }

  checkExistingNonceGas (tx: TransactionData) {
    const { from, nonce } = tx

    const reqs = this.store('main.accounts', from, 'requests')
    const requests = Object.keys(reqs || {}).map(key => reqs[key])
    const existing = requests.filter(r => (
      r.mode === 'monitor' && 
      r.status !== 'error' && 
      r.data.nonce === nonce
    ))

    if (existing.length > 0) {
      if (tx.maxPriorityFeePerGas && tx.maxFeePerGas) {
        const existingFee = Math.max(...existing.map(r => r.data.maxPriorityFeePerGas))
        const existingMax = Math.max(...existing.map(r => r.data.maxFeePerGas))
        const feeInt = parseInt(tx.maxPriorityFeePerGas)
        const maxInt = parseInt(tx.maxFeePerGas)
        if (existingFee * 1.1 >= feeInt || existingMax * 1.1 >= maxInt) {
          // Bump fees by 10%
          const bumpedFee = Math.max(Math.ceil(existingFee * 1.1), feeInt)
          const bumpedBase = Math.max(Math.ceil((existingMax - existingFee) * 1.1), Math.ceil(maxInt - feeInt))
          tx.maxFeePerGas = '0x' + (bumpedBase + bumpedFee).toString(16)
          tx.maxPriorityFeePerGas = '0x' + bumpedFee.toString(16)
          tx.feesUpdated = true
        }
      } else if (tx.gasPrice) {
        const existingPrice = Math.max(...existing.map(r => r.data.gasPrice))
        const priceInt = parseInt(tx.gasPrice)
        if (existingPrice >= priceInt) {
          // Bump price by 10%
          const bumpedPrice = Math.ceil(existingPrice * 1.1)
          tx.gasPrice = '0x' + bumpedPrice.toString(16)
          tx.feesUpdated = true
        }
      }
    }

    return tx
  }

  async fillTransaction (newTx: RPC.SendTransaction.TxParams, cb: Callback<TransactionMetadata>) {
    if (!newTx) return cb(new Error('No transaction data'))

    try {
      const approvals: RequiredApproval[] = []
      const rawTx = this.getRawTx(newTx)
      const gas = this.gasFees(rawTx)
      const chainConfig = this.connection.connections['ethereum'][parseInt(rawTx.chainId)].chainConfig

      const estimateGas = rawTx.gasLimit
        ? Promise.resolve(rawTx)
        : this.getGasEstimate(rawTx)
          .then(gasLimit => ({ ...rawTx, gasLimit }))
          .catch(err => {
            approvals.push({
              type: ApprovalType.GasLimitApproval,
              data: {
                message: err.message,
                gasLimit: '0x00'
              }
            })

            return { ...rawTx, gasLimit: '0x00' }
         })

      estimateGas
        .then(tx => {
          const populatedTransaction = populateTransaction(tx, chainConfig, gas)

          log.info({ populatedTransaction })

          return populatedTransaction
        })
        .then(tx => this.checkExistingNonceGas(tx))
        .then(tx => cb(null, { tx, approvals }))
        .catch(cb)
    } catch (e) {
      log.error('error creating transaction', e)
      cb(e as Error)
    }
  }

  sendTransaction (payload: RPC.SendTransaction.Request, res: RPCRequestCallback) {
    const txParams = payload.params[0]
    const targetChain = payload.chainId
    const txChain = txParams.chainId

    if (targetChain && txChain && targetChain !== txChain) {
      return this.resError(`Chain for transaction (${txChain}) does not match request target chain (${targetChain})`, payload, res)
    }

    const newTx = {
      ...txParams,
      chainId: txChain || (targetChain as string)
    }

    const currentAccount = accounts.current()

    log.verbose(`sendTransaction(${JSON.stringify(newTx)}`)

    this.fillTransaction(newTx, (err, transactionMetadata) => {
      if (err) {
        this.resError(err, payload, res)
      } else {
        const txMetadata = transactionMetadata as TransactionMetadata
        const from = txMetadata.tx.from

        if (from && !this.isCurrentAccount(from, currentAccount)) return this.resError('Transaction is not from currently selected account', payload, res)

        const handlerId = this.addRequestHandler(res)
        const { feesUpdated, ...data } = txMetadata.tx

        const req = {
          handlerId, 
          type: 'transaction', 
          data, 
          payload, 
          account: (currentAccount as FrameAccount).id, 
          origin: payload._origin, 
          approvals: [],
          feesUpdatedByUser: feesUpdated || false
        } as TransactionRequest

        accounts.addRequest(req, res)

        txMetadata.approvals.forEach(approval => {
          currentAccount?.addRequiredApproval(req, approval.type, approval.data)
        })
      }
    })
  }

  getTransactionByHash (payload: RPCRequestPayload, cb: RPCRequestCallback, targetChain: Chain) {
    const res = (response: any) => {
      if (response.result && !response.result.gasPrice && response.result.maxFeePerGas) {
        return cb({ ...response, result: { ...response.result, gasPrice: response.result.maxFeePerGas } })
      }

      cb(response)
    }

    this.connection.send(payload, res, targetChain)
  }

  sign (payload: RPCRequestPayload, res: RPCRequestCallback) {
    // normalize the payload for downstream rendering, taking the first address and
    // making it the first parameter, which is the account that needs to sign
    const addressIndex = payload.params.findIndex(utils.isAddress)

    const orderedParams = addressIndex > 0
      ? [
          payload.params[addressIndex],
          ...payload.params.slice(0, addressIndex),
          ...payload.params.slice(addressIndex + 1)
        ]
      : payload.params

    const normalizedPayload = {
      ...payload,
      params: orderedParams
    }

    const from = orderedParams[0]
    const currentAccount = accounts.current()

    if (!this.isCurrentAccount(from, currentAccount)) return this.resError('sign request is not from currently selected account.', payload, res)

    const handlerId = this.addRequestHandler(res)

    const req = { handlerId, type: 'sign', payload: normalizedPayload, account: (currentAccount as FrameAccount).getAccounts()[0], origin: payload._origin } as const

    const _res = (data: any) => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    accounts.addRequest(req, _res)
  }

  signTypedData (rawPayload: RPCRequestPayload, version: Version, res: RPCRequestCallback) {
    // v1 has the param order as: [data, address, ...], all other versions have [address, data, ...]
    const orderedParams = version === 'V1'
      ? [rawPayload.params[1], rawPayload.params[0], ...rawPayload.params.slice(2)]
      : [...rawPayload.params]

    const payload = {
      ...rawPayload,
      params: orderedParams
    }

    let [from = '', typedData = {}, ...additionalParams] = payload.params

    const targetAccount = accounts.get(from.toLowerCase())

    if (!targetAccount) {
      return this.resError(`unknown account: ${from}`, payload, res)
    }

    // HACK: Standards clearly say, that second param is an object but it seems like in the wild it can be a JSON-string.
    if (typeof (typedData) === 'string') {
      try {
        typedData = JSON.parse(typedData)
        payload.params = [from, typedData, ...additionalParams]
      } catch (e) {
        return this.resError('Malformed typedData.', payload, res)
      }
    }

    const signerType = getSignerType(targetAccount.lastSignerType)

    // check for signers that only support signing a specific version of typed data
    if (version !== 'V4' && signerType && [SignerType.Ledger, SignerType.Lattice, SignerType.Trezor].includes(signerType)) {
      const signerName = capitalize(signerType)
      return this.resError(`${signerName} only supports eth_signTypedData_v4+`, payload, res)
    }

    const handlerId = this.addRequestHandler(res)

    accounts.addRequest({ handlerId, type: 'signTypedData', version, payload, account: targetAccount.address, origin: payload._origin } as SignTypedDataRequest)
  }

  subscribe (payload: RPC.Subscribe.Request, res: RPCSuccessCallback) {
    const subId = addHexPrefix(crypto.randomBytes(16).toString('hex'))
    const subscriptionType = payload.params[0]
    
    this.subscriptions[subscriptionType] = this.subscriptions[subscriptionType] || []
    this.subscriptions[subscriptionType].push(subId)

    res({ id: payload.id, jsonrpc: '2.0', result: subId })
  }

  ifSubRemove (id: string) {
    return Object.keys(this.subscriptions).some(type => {
      const subscriptionType = type as SubscriptionType
      const index = this.subscriptions[subscriptionType].indexOf(id)

      return (index > -1) && this.subscriptions[subscriptionType].splice(index, 1)
    })
  }

  clientVersion (payload: RPCRequestPayload, res: RPCSuccessCallback) {
    res({ id: payload.id, jsonrpc: '2.0', result: `Frame/v${packageFile.version}` })
  }

  private switchEthereumChain (payload: RPCRequestPayload, res: RPCRequestCallback) {
    try {
      const params = payload.params
      if (!params || !params[0]) throw new Error('Params not supplied')
      
      const type = 'ethereum'

      const chainId = parseInt(params[0].chainId)
      if (!Number.isInteger(chainId)) throw new Error('Invalid chain id')

      // Check if chain exists 
      const exists = Boolean(store('main.networks', type, chainId))
      if (exists === false) throw new Error('Chain does not exist')

      if (store('main.currentNetwork.id') === chainId) return res({ id: payload.id, jsonrpc: '2.0', result: null })

      const handlerId = this.addRequestHandler(res)
      
      // Ask user if they want to switch chains
      accounts.addRequest({
        handlerId,
        type: 'switchChain',
        chain: { 
          type, 
          id: params[0].chainId
        },
        account: (accounts.getAccounts() || [])[0],
        origin: payload._origin,
        payload
      } as SwitchChainRequest, res)
    } catch (e) {
      return this.resError(e as EVMError, payload, res)
    }
  }

  addEthereumChain (payload: RPCRequestPayload, res: RPCRequestCallback) {
    if (!payload.params[0]) return this.resError('addChain request missing params', payload, res)

    const type = 'ethereum'
    const { 
      chainId, 
      chainName, 
      nativeCurrency, 
      rpcUrls = [], 
      blockExplorerUrls = [],
      iconUrls = [] 
    } = payload.params[0]

    if (!chainId) return this.resError('addChain request missing chainId', payload, res)
    if (!chainName) return this.resError('addChain request missing chainName', payload, res)
    if (!nativeCurrency) return this.resError('addChain request missing nativeCurrency', payload, res)

    const handlerId = this.addRequestHandler(res)

    // Check if chain exists
    const id = parseInt(chainId)
    if (!Number.isInteger(id)) throw new Error('Invalid chain id')

    const exists = Boolean(store('main.networks', type, id))
    if (exists) {
      // Ask user if they want to switch chains
      this.switchEthereumChain(payload, res)
    } else {
      // Ask user if they want to add this chain
      accounts.addRequest({
        handlerId,
        type: 'addChain',
        chain: {
          type,
          id: chainId,
          name: chainName,
          nativeCurrency,
          rpcUrls,
          blockExplorerUrls, 
          iconUrls
        },
        account: (accounts.getAccounts() || [])[0],
        origin: payload._origin,
        payload
      } as AddChainRequest, res)
    }
  }

  getPermissions (payload: JSONRPCRequestPayload, res: RPCRequestCallback) {
    const now = new Date().getTime()
    const toPermission = permission.bind(null, now)
    const allowedOperations = protectedMethods.map(toPermission)

    res({ id: payload.id, jsonrpc: '2.0', result: allowedOperations })
  }

  requestPermissions (payload: JSONRPCRequestPayload, res: RPCRequestCallback) {
    // we already require the user to grant permission to call this method so
    // we just need to return permission objects for the requested operations
    const now = new Date().getTime()
    const requestedOperations = (payload.params || []).map(param => permission(now, Object.keys(param)[0]))

    res({ id: payload.id, jsonrpc: '2.0', result: requestedOperations })
  }

  private addCustomToken (payload: RPCRequestPayload, cb: RPCRequestCallback, targetChain: Chain) {
    const { type, options: tokenData } = (payload.params || {}) as any

    if ((type || '').toLowerCase() !== 'erc20') {
      return this.resError('only ERC-20 tokens are supported', payload, cb)
    }

    this.getChainId(payload, resp => {
      const chainId = parseInt(resp.result)

      const address = (tokenData.address || '').toLowerCase()
      const symbol = (tokenData.symbol || '').toUpperCase()
      const decimals = parseInt(tokenData.decimals || '1')

      if (!address) {
        return this.resError('tokens must define an address', payload, cb)
      }

      const res = () => {
        cb({ id: payload.id, jsonrpc: '2.0', result: true })
      }

      // don't attempt to add the token if it's already been added
      const tokenExists = store('main.tokens.custom').some((token: Token) => token.chainId === chainId && token.address === address)
      if (tokenExists) {
        return res()
      }

      const token = {
        chainId,
        name: tokenData.name || capitalize(symbol),
        address,
        symbol,
        decimals,
        logoURI: tokenData.image || tokenData.logoURI || ''
      }

      // const result = {
      //   suggestedAssetMeta: {
      //     asset: { token }
      //   }
      // }

      const handlerId = this.addRequestHandler(res)

      accounts.addRequest({
        handlerId,
        type: 'addToken',
        token,
        account: (accounts.current() as FrameAccount).id,
        origin: payload._origin,
        payload
      } as AddTokenRequest, res)
    }, targetChain)
  }

  private getAssets (payload: RPC.GetAssets.Request, cb: RPCCallback<RPC.GetAssets.Response>) {
    const currentAccount = accounts.current()
    if (!currentAccount) return this.resError('no account selected', payload, cb)

    if (isScanning(currentAccount.id)) return this.resError({ message: 'assets not known for account', code: 5901 }, payload, cb)

    const { nativeCurrency, erc20 } = loadAssets(currentAccount.id)
    const { id, jsonrpc } = payload

    cb({ id, jsonrpc, result: { nativeCurrency, erc20 }})
  }

  private parseTargetChain (payload: RPCRequestPayload) {
    const target: Chain = { type: 'ethereum', id: 0 }

    if (!('chainId' in payload)) {
      return { ...target, id: store('main.currentNetwork.id') }
    }

    const chainId = parseInt(payload.chainId || '', 16)
    const chainConnection = this.connection.connections['ethereum'][chainId] || {}

    if (chainConnection.chainConfig) {
      target.id = chainId
    }

    return target
  }

  sendAsync (payload: RPCRequestPayload, cb: Callback<RPCResponsePayload>) {
    this.send(payload, res => {
      if (res.error) {
        const errMessage = res.error.message || `sendAsync error did not have message`
        cb(new Error(errMessage))
      } else {
        cb(null, res)
      }
    })
  }

  send (payload: RPCRequestPayload, res: RPCRequestCallback = () => {}) {
    const method = payload.method || ''
    const targetChain = this.parseTargetChain(payload)

    if (!targetChain.id) {
      log.warn('received request with unknown chain', JSON.stringify(payload))
      return this.resError({ message: `unknown chain: ${payload.chainId}`, code: 4901 }, payload, res)
    }

    if (method === 'eth_coinbase') return this.getCoinbase(payload, res)
    if (method === 'eth_accounts') return this.getAccounts(payload, res)
    if (method === 'eth_requestAccounts') return this.getAccounts(payload, res)
    if (method === 'eth_sendTransaction') return this.sendTransaction(payload as RPC.SendTransaction.Request, res)
    if (method === 'eth_getTransactionByHash') return this.getTransactionByHash(payload, res, targetChain)
    if (method === 'personal_ecRecover') return this.ecRecover(payload, res)
    if (method === 'web3_clientVersion') return this.clientVersion(payload, res)
    if (method === 'eth_subscribe' && payload.params[0] in this.subscriptions) {
      return this.subscribe(payload as RPC.Subscribe.Request, res)
    }

    if (method === 'eth_unsubscribe' && this.ifSubRemove(payload.params[0])) return res({ id: payload.id, jsonrpc: '2.0', result: true }) // Subscription was ours
    if (method === 'eth_sign' || method === 'personal_sign') return this.sign(payload, res)

    if (['eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].includes(method)) {
      const underscoreIndex = method.lastIndexOf('_')
      const version = (underscoreIndex > 3 ? method.substring(underscoreIndex + 1) : 'v1').toUpperCase() as Version
      return this.signTypedData(payload, version, res)
    }
    
    if (method === 'wallet_addEthereumChain') return this.addEthereumChain(payload, res)
    if (method === 'wallet_switchEthereumChain') return this.switchEthereumChain(payload, res)
    if (method === 'wallet_getPermissions') return this.getPermissions(payload, res)
    if (method === 'wallet_requestPermissions') return this.requestPermissions(payload, res)
    if (method === 'wallet_watchAsset') return this.addCustomToken(payload, res, targetChain)
    if (method === 'wallet_getChains') return this.getChains(payload, res)
    if (method === 'wallet_getAssets') return this.getAssets(payload as RPC.GetAssets.Request, res as RPCCallback<RPC.GetAssets.Response>)

    // Connection dependent methods need to pass targetChain
    if (method === 'net_version') return this.getNetVersion(payload, res, targetChain)
    if (method === 'eth_chainId') return this.getChainId(payload, res, targetChain)

    // remove custom data
    const { _origin, chainId, ...rpcPayload } = payload

    // Pass everything else to our connection
    this.connection.send(rpcPayload, res, targetChain)
  }

  emit (type: string | symbol, ...args: any[]) {
    return super.emit(type, ...args)
  }
}

const provider = new Provider()

function getActiveChains () {
  const chains: Record<string, Network> = store('main.networks.ethereum') || {}

  return Object.values(chains)
    .filter(chain => chain.on)
    .map(chain => chain.id)
    .sort((a, b) => a - b)
}

let network = store('main.currentNetwork.id'), availableChains = getActiveChains()

store.observer(() => {
  const currentNetworkId = store('main.currentNetwork.id')
  const currentChains = getActiveChains()

  if (network !== currentNetworkId) {
    network = currentNetworkId
    provider.chainChanged(network)
    provider.networkChanged(network)
  }

  if (!arraysMatch(currentChains, availableChains)) {
    availableChains = currentChains
    provider.chainsChanged(availableChains)
  }
}, 'provider:chains')

let debouncedAssets: RPC.GetAssets.Assets | null = null

store.observer(() => {
  const currentAccountId = store('selected.current')

  if (currentAccountId) {
    const assets = loadAssets(currentAccountId)

    if (!isScanning(currentAccountId) && (assets.erc20.length > 0 || assets.nativeCurrency.length > 0)) {
      if (!debouncedAssets) {
        setTimeout(() => {
          if (debouncedAssets) {
            provider.assetsChanged(currentAccountId, debouncedAssets)
            debouncedAssets = null
          }
        }, 800)
      }

      debouncedAssets = assets
    }
  }
}, 'provider:account')

export default provider
