// @ts-ignore
import { v4 as uuid } from 'uuid'
import EventEmitter from 'events'
import log from 'electron-log'
import utils from 'web3-utils'
import { recoverTypedMessage, Version } from 'eth-sig-util'
import crypto from 'crypto'
import {
  addHexPrefix,
  intToHex,
  isHexString,
  isHexPrefixed,
  fromUtf8,
} from 'ethereumjs-util'

import store from '../store'
import packageFile from '../../package.json'
import proxyConnection from './proxy'
import accounts, { AccountRequest, TransactionRequest, SignTypedDataRequest, AddChainRequest, AddTokenRequest } from '../accounts'
import Chains from '../chains'
import { getType as getSignerType, Type as SignerType } from '../signers/Signer'
import { populate as populateTransaction, maxFee, TransactionData } from '../transaction'
import FrameAccount from '../accounts/Account'
import { capitalize, arraysMatch } from '../../resources/utils'
import { ApprovalType } from '../../resources/constants'
import { checkExistingNonceGas, ecRecover, feeTotalOverMax, gasFees, getActiveChains, getAssets, getChains, getPermissions, getRawTx, getSignedAddress, isCurrentAccount, isScanning, loadAssets, requestPermissions, resError } from './helpers'

type Subscriptions = { [key in SubscriptionType]: string[] }

interface RequiredApproval {
  type: ApprovalType,
  data: any
}

export interface TransactionMetadata {
  tx: TransactionData,
  approvals: RequiredApproval[]
}

const storeApi = {
  getOrigins: () => {
    return store('main.origins') as Record<string, Origin>
  },
  getOrigin: (originId: string) => {
    return store('main.origins', originId) as Origin
  }
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

  constructor () {
    super()

    this.connection.syncDataEmit(this)
    this.connection.on('connect', (...args) => {
      this.connected = true
      this.emit('connect', ...args)
    })
    this.connection.on('close', () => { 
      this.connected = false
    })
    this.connection.on('data', (...args) => {
      this.emit('data', ...args)
    })
    this.connection.on('error', (chain, err) => {
      log.error(err)
    })
    this.connection.on('update', (chain, event) => {
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
  chainChanged (chainId: number, origin: Origin) {
    const chain = intToHex(chainId)

    this.subscriptions.chainChanged.forEach(subscription => {
      this.emit('data', { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, origin: origin.name, result: chain } })
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

  getNetVersion (payload: RPCRequestPayload, res: RPCRequestCallback, targetChain: Chain) {
    const connection = this.connection.connections[targetChain.type][targetChain.id]
    const chainConnected = (connection.primary?.connected || connection.secondary?.connected)

    const response = chainConnected
      ? { result: targetChain.id.toString() }
      : { error: { message: 'not connected', code: 1 } }

    res({ id: payload.id, jsonrpc: payload.jsonrpc, ...response })
  }

  getChainId (payload: RPCRequestPayload, res: RPCSuccessCallback, targetChain: Chain) {
    const connection = this.connection.connections[targetChain.type][targetChain.id]
    const chainConnected = (connection.primary?.connected || connection.secondary?.connected)

    const response = chainConnected
      ? { result: intToHex(targetChain.id) }
      : { error: { message: 'not connected', code: 1 } }

    res({ id: payload.id, jsonrpc: payload.jsonrpc, ...response })
  }

  declineRequest (req: AccountRequest) {
    const res = (data: any) => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    const payload = req.payload
    resError({ message: 'User declined transaction', code: 4001 }, payload, res)
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

    getSignedAddress(signed, message, (err, verifiedAddress) => {
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
        resError(err.message, payload, res)
        cb(err, undefined)
      } else {
        const signature = signed || ''
        this.verifySignature(signature, message, address, err => {
          if (err) {
            resError(err.message, payload, res)
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
        resError(err.message, payload, res)
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
        } catch (err: any) {
          resError(err.message, payload, res)

          cb(err)
        }
      }
    })
  }

  signAndSend (req: TransactionRequest, cb: Callback<string>) {
    const rawTx = req.data
    const res = (data: any) => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    const payload = req.payload
    const maxTotalFee = maxFee(rawTx)

    if (feeTotalOverMax(rawTx, maxTotalFee)) {
      const chainId = parseInt(rawTx.chainId)
      const symbol = store(`main.networks.ethereum.${chainId}.symbol`)
      const displayAmount = symbol
        ? ` (${Math.floor(maxTotalFee / 1e18)} ${symbol})`
        : ''

      const err = `Max fee is over hard limit${displayAmount}`

      resError(err, payload, res)
      cb(new Error(err))
    } else {
      accounts.signTransaction(rawTx, (err, signedTx) => { // Sign Transaction
        if (err) {
          resError(err, payload, res)
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
                  resError(response.error, payload, res)
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

  getNonce (rawTx: TransactionData, res: RPCRequestCallback) {
    const targetChain: Chain = {
      type: 'ethereum',
      id: parseInt(rawTx.chainId, 16)
    }

    this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [rawTx.from, 'pending'] }, res, targetChain)
  }

  async fillTransaction (newTx: RPC.SendTransaction.TxParams, cb: Callback<TransactionMetadata>) {
    if (!newTx) return cb(new Error('No transaction data'))

    try {
      const approvals: RequiredApproval[] = []
      const accountId = (accounts.current() || {}).id
      const rawTx = getRawTx(newTx, accountId)
      const gas = gasFees(rawTx)
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
        .then(tx => checkExistingNonceGas(tx))
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
      return resError(`Chain for transaction (${txChain}) does not match request target chain (${targetChain})`, payload, res)
    }

    const newTx = {
      ...txParams,
      chainId: txChain || (targetChain as string)
    }

    const currentAccount = accounts.current()

    log.verbose(`sendTransaction(${JSON.stringify(newTx)}`)

    this.fillTransaction(newTx, (err, transactionMetadata) => {
      if (err) {
        resError(err, payload, res)
      } else {
        const txMetadata = transactionMetadata as TransactionMetadata
        const from = txMetadata.tx.from

        if (from && !isCurrentAccount(from, currentAccount)) return resError('Transaction is not from currently selected account', payload, res)

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

    if (!isCurrentAccount(from, currentAccount)) return resError('sign request is not from currently selected account.', payload, res)

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
      return resError(`unknown account: ${from}`, payload, res)
    }

    // HACK: Standards clearly say, that second param is an object but it seems like in the wild it can be a JSON-string.
    if (typeof (typedData) === 'string') {
      try {
        typedData = JSON.parse(typedData)
        payload.params = [from, typedData, ...additionalParams]
      } catch (e) {
        return resError('Malformed typedData.', payload, res)
      }
    }

    const signerType = getSignerType(targetAccount.lastSignerType)

    // check for signers that only support signing a specific version of typed data
    if (version !== 'V4' && signerType && [SignerType.Ledger, SignerType.Lattice, SignerType.Trezor].includes(signerType)) {
      const signerName = capitalize(signerType)
      return resError(`${signerName} only supports eth_signTypedData_v4+`, payload, res)
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
      

      const chainId = parseInt(params[0].chainId)
      if (!Number.isInteger(chainId)) throw new Error('Invalid chain id')

      // Check if chain exists 
      const exists = Boolean(store('main.networks', 'ethereum', chainId))
      if (exists === false) throw new Error('Chain does not exist')

      const origin = storeApi.getOrigin(payload._origin)
      
      if (origin.chain.id !== chainId) {
        store.switchOriginChain(payload._origin, chainId, origin.chain.type)
        this.chainChanged(chainId, origin)
      }

      return res({ id: payload.id, jsonrpc: '2.0', result: undefined })
    } catch (e) {
      return resError(e as EVMError, payload, res)
    }
  }

  addEthereumChain (payload: RPCRequestPayload, res: RPCRequestCallback) {
    if (!payload.params[0]) return resError('addChain request missing params', payload, res)

    const type = 'ethereum'
    const { 
      chainId, 
      chainName, 
      nativeCurrency, 
      rpcUrls = [], 
      blockExplorerUrls = [],
      iconUrls = [] 
    } = payload.params[0]

    if (!chainId) return resError('addChain request missing chainId', payload, res)
    if (!chainName) return resError('addChain request missing chainName', payload, res)
    if (!nativeCurrency) return resError('addChain request missing nativeCurrency', payload, res)

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

  private addCustomToken (payload: RPCRequestPayload, cb: RPCRequestCallback, targetChain: Chain) {
    const { type, options: tokenData } = (payload.params || {}) as any

    if ((type || '').toLowerCase() !== 'erc20') {
      return resError('only ERC-20 tokens are supported', payload, cb)
    }

    this.getChainId(payload, resp => {
      const chainId = parseInt(resp.result)

      const address = (tokenData.address || '').toLowerCase()
      const symbol = (tokenData.symbol || '').toUpperCase()
      const decimals = parseInt(tokenData.decimals || '1')

      if (!address) {
        return resError('tokens must define an address', payload, cb)
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

  private parseTargetChain (payload: RPCRequestPayload): Chain {
    if ('chainId' in payload) {
      const chainId = parseInt(payload.chainId || '', 16)
      const chainConnection = this.connection.connections['ethereum'][chainId] || {}

      if (chainConnection.chainConfig) {
        return { type: 'ethereum', id: chainId }
      }
    }
    
    return storeApi.getOrigin(payload._origin).chain
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

    if (!targetChain) {
      log.warn('received request with unknown chain', JSON.stringify(payload))
      return resError({ message: `unknown chain: ${payload.chainId}`, code: 4901 }, payload, res)
    }

    function getAccounts (payload: JSONRPCRequestPayload, res: RPCRequestCallback) {
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: accounts.getSelectedAddresses().map(a => a.toLowerCase()) })
    }

    function getCoinbase (payload: RPCRequestPayload, res: RPCRequestCallback) {
      accounts.getAccounts((err, accounts) => {
        if (err) return resError(`signTransaction Error: ${JSON.stringify(err)}`, payload, res)
        res({ id: payload.id, jsonrpc: payload.jsonrpc, result: (accounts || [])[0] })
      })
    }

    if (method === 'eth_coinbase') return getCoinbase(payload, res)
    if (method === 'eth_accounts') return getAccounts(payload, res)
    if (method === 'eth_requestAccounts') return getAccounts(payload, res)
    if (method === 'eth_sendTransaction') return this.sendTransaction(payload as RPC.SendTransaction.Request, res)
    if (method === 'eth_getTransactionByHash') return this.getTransactionByHash(payload, res, targetChain)
    if (method === 'personal_ecRecover') return ecRecover(payload, res)
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
    if (method === 'wallet_getPermissions') return getPermissions(payload, res)
    if (method === 'wallet_requestPermissions') return requestPermissions(payload, res)
    if (method === 'wallet_watchAsset') return this.addCustomToken(payload, res, targetChain)
    if (method === 'wallet_getChains') return getChains(payload, res)
    if (method === 'wallet_getAssets') return getAssets(payload as RPC.GetAssets.Request, accounts.current(), res as RPCCallback<RPC.GetAssets.Response>)

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
let origins = storeApi.getOrigins()
let availableChains = getActiveChains()

store.observer(() => {
  const currentOrigins = storeApi.getOrigins()
  const currentChains = getActiveChains()

  Object.entries(currentOrigins).forEach(([originId, origin]) => {
    if(origins[originId].chain.id !== origin.chain.id) {
      provider.chainChanged(origin.chain.id, origin)
      provider.networkChanged(origin.chain.id)
    }
  })

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
