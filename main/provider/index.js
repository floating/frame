const { v4: uuid } = require('uuid')
const EventEmitter = require('events')
const log = require('electron-log')
const utils = require('web3-utils')
const ethSignature = require('eth-sig-util')

const {
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
  hashPersonalMessage
} = require('ethereumjs-util')


const proxy = require('./proxy')

const store = require('../store')
const chains = require('../chains')
const accounts = require('../accounts')

const { populate: populateTransaction, usesBaseFee, maxFee } = require('../transaction')

const version = require('../../package.json').version

function equalCaseInsensitive(s1, s2) {
  return s1.toLowerCase() === s2.toLowerCase()
}

class Provider extends EventEmitter {
  constructor () {
    super()
    this.store = store
    this.handlers = {}
    this.nonce = {}
    this.connected = false
    this.connection = chains
    this.connection.syncDataEmit(this)
    this.connection.on('connect', () => { 
      this.connected = true
      this.emit('connect')
    })
    this.connection.on('close', () => { this.connected = false })
    this.connection.on('data', data => this.emit('data', data))
    this.connection.on('error', err => log.error(err))
    this.getNonce = this.getNonce.bind(this)
    this.subs = { accountsChanged: [], chainChanged: [], networkChanged: [] }
  }

  accountsChanged (accounts) {
    this.subs.accountsChanged.forEach(subscription => {
      this.emit('data:address', accounts[0], { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: accounts } })
    })
  }

  chainChanged (netId) {
    this.subs.chainChanged.forEach(subscription => {
      this.emit('data', { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: netId } })
    })
  }

  networkChanged (netId) {
    this.subs.networkChanged.forEach(subscription => {
      this.emit('data', { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: netId } })
    })
  }

  randHex (len) {
    const maxlen = 8
    const min = Math.pow(16, Math.min(len, maxlen) - 1)
    const max = Math.pow(16, Math.min(len, maxlen)) - 1
    const n = Math.floor(Math.random() * (max - min + 1)) + min
    let r = n.toString(16)
    while (r.length < len) r = r + this.randHex(len - maxlen)
    return r
  }

  getCoinbase (payload, res) {
    accounts.getAccounts((err, accounts) => {
      if (err) return this.resError(`signTransaction Error: ${JSON.stringify(err)}`, payload, res)
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: accounts[0] })
    })
  }

  getAccounts (payload, res) {
    res({ id: payload.id, jsonrpc: payload.jsonrpc, result: accounts.getSelectedAddresses().map(a => a.toLowerCase()) })
  }

  getNetVersion (payload, res, targetChain) {
    const { type, id } = (targetChain || store('main.currentNetwork'))
    const chain = store('main.networks', type, id)
    res({ id: payload.id, jsonrpc: payload.jsonrpc, result: `${chain.id}` })
  }

  getChainId (payload, res, targetChain) {
    const { type, id } = (targetChain || store('main.currentNetwork'))
    const chain = store('main.networks', type, id)
    res({ id: payload.id, jsonrpc: payload.jsonrpc, result: intToHex(chain.id) })
  }

  declineRequest (req) {
    const res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }
    const payload = req.payload
    this.resError({ message: 'User declined transaction', code: 4001 }, payload, res)
  }

  resError (errorData, payload, res) {
    const error = (typeof errorData === 'string')
      ? { message: errorData, code: -1 }
      : { message: errorData.message, code: errorData.code || -1 }

    log.warn(error)
    res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
  }

  getSignedAddress (signed, message, cb) {
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

  ecRecover (payload, res) {
    const message = payload.params[0]
    const signed = payload.params[1]
    this.getSignedAddress(signed, message, (err, verifiedAddress) => {
      if (err) return this.resError(err.message, payload, res)
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: verifiedAddress })
    })
  }

  verifySignature (signed, message, address, cb) {
    if (signed.length === 134) { // Aragon smart signed message
      try {
        signed = '0x' + signed.substring(4)
        const actor = accounts.current().smart && accounts.current().smart.actor
        address = accounts.get(actor.id).address
      } catch (e) {
        return cb(new Error('Could not resolve message or actor for smart accoount'))
      }
    }
    this.getSignedAddress(signed, message, (err, verifiedAddress) => {
      if (err) return cb(err)
      if (verifiedAddress.toLowerCase() !== address.toLowerCase()) return cb(new Error('Frame verifySignature: Failed ecRecover check'))
      cb(null, true)
    })
  }

  approveSign (req, cb) {
    const res = data => {
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
        cb(err.message)
      } else {
        this.verifySignature(signed, message, address, err => {
          if (err) {
            this.resError(err.message, payload, res)
            cb(err.message)
          } else {
            res({ id: payload.id, jsonrpc: payload.jsonrpc, result: signed })
            cb(null, signed)
          }
        })
      }
    })
  }

  approveSignTypedData (req, cb) {
    const res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }
    const payload = req.payload
    const [address, data] = payload.params

    accounts.signTypedData(req.version, address, data, (err, sig) => {
      if (err) {
        this.resError(err.message, payload, res)
        cb(err.message)
      } else {
        const recoveredAddress = ethSignature.recoverTypedMessage({ data, sig }, req.version)
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          const err = new Error('TypedData signature verification failed')
          this.resError(err.message, { ...payload, recoveredAddress }, res)
          cb(err.message)
        } else {
          res({ id: payload.id, jsonrpc: payload.jsonrpc, result: sig })
          cb(null, sig)
        }
      }
    })
  }

  feeTotalOverMax (rawTx, maxTotalFee) {
    const maxFeePerGas = usesBaseFee(rawTx) ? parseInt(rawTx.maxFeePerGas, 'hex') : parseInt(rawTx.gasPrice, 'hex')
    const gasLimit = parseInt(rawTx.gasLimit, 'hex')
    const totalFee = maxFeePerGas * gasLimit
    return totalFee > maxTotalFee
  }

  signAndSend (req, cb) {
    const rawTx = req.data
    const res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    const payload = req.payload
    const maxTotalFee = maxFee(rawTx)

    if (this.feeTotalOverMax(rawTx, maxTotalFee)) {
      const chainId = parseInt(rawTx.chainId).toString()
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
          cb(new Error(err))
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
                  cb(response.error.message)
                } else {
                  res(response)
                  cb(null, response.result)
                }
              }, {
                type: 'ethereum',
                id: parseInt(req.data.chainId, 'hex').toString()
              })
            }
            const broadcastTimer = setInterval(() => cast(), 1000)
            cast()
          })
        }
      })
    }
  }

  approveRequest (req, cb) {
    log.info('approveRequest', req)
    accounts.lockRequest(req.handlerId)
    if (req.data.nonce) return this.signAndSend(req, cb)
    this.getNonce(req.data, response => {
      if (response.error) {
        if (this.handlers[req.handlerId]) {
          this.handlers[req.handlerId](response)
          delete this.handlers[req.handlerId]
        }

        return cb(response.error)
      }

      const updatedReq = accounts.updateNonce(req.handlerId, response.result)
      this.signAndSend(updatedReq, cb)
    })
  }

  getRawTx (newTx) {
    const { gas, gasLimit, gasPrice, data, value, ...rawTx } = newTx

    return {
      ...rawTx,
      value: addHexPrefix(unpadHexString(value || '0x') || '0'),
      data: addHexPrefix(padToEven(stripHexPrefix(data || '0x'))),
      gasLimit: gasLimit || gas,
      chainId: rawTx.chainId || utils.toHex(store('main.currentNetwork.id'))
    }
  }
  
  async _getGasEstimate (rawTx, chainConfig) {
    const { chainId, ...rest } = rawTx
    const txParams = chainConfig.isActivatedEIP(2930) ? rawTx : rest

    const payload = { method: 'eth_estimateGas', params: [txParams], jsonrpc: '2.0', id: 1 }
    const targetChain = {
      type: 'ethereum',
      id: parseInt(rawTx.chainId, 16)
    }

    return new Promise((resolve, reject) => {
      this.connection.send(payload, response => {
        return response.error
          ? reject(response.error)
          : resolve(response.result)
      }, targetChain)
    })
  }

  _isCurrentAccount (address, account = accounts.current()) {
    return address && (account.id.toLowerCase() === address.toLowerCase())
  }

  _gasFees (rawTx) {
    const chain = {
      type: 'ethereum',
      id: parseInt(rawTx.chainId, 'hex')
    }

    return store('main.networksMeta', chain.type, chain.id, 'gas')
  }

  getNonce (rawTx, res) {
    const targetChain = {
      type: 'ethereum',
      id: (rawTx && rawTx.chainId) ? parseInt(rawTx.chainId, 'hex') : undefined
    }

    this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [rawTx.from, 'pending'] }, (response) => {
      if (response.result) this.nonce = { age: Date.now(), current: response.result, account: rawTx.from }
      res(response)
    }, targetChain)
  }

  fillTransaction (newTx, cb) {
    if (!newTx) return cb('No transaction data')
    const rawTx = this.getRawTx(newTx)
    const gas = this._gasFees(rawTx)
    const chainConfig = this.connection.connections['ethereum'][parseInt(rawTx.chainId)].chainConfig

    const estimateGas = rawTx.gasLimit
      ? Promise.resolve(rawTx)
      : this._getGasEstimate(rawTx, chainConfig)
        .then(gasLimit => ({ ...rawTx, gasLimit }))
        .catch(err => ({ ...rawTx, gasLimit: '0x00', warning: err.message }))

    estimateGas
      .then(tx => populateTransaction(tx, chainConfig, gas))
      .then(tx => cb(null, tx))
      .catch(cb)
  }

  sendTransaction (payload, res) {
    const newTx = payload.params[0]
    const currentAccount = accounts.current()

    this.fillTransaction(newTx, (err, tx) => {
      if (err) {
        this.resError(err, payload, res)
      } else {
        const from = tx.from

        if (from && !this._isCurrentAccount(from, currentAccount)) return this.resError('Transaction is not from currently selected account', payload, res)
        const handlerId = uuid()
        this.handlers[handlerId] = res

        const { warning, ...data } = tx
        
        accounts.addRequest({ handlerId, type: 'transaction', data, payload, account: currentAccount.id, origin: payload._origin, warning }, res)
      }
    })
  }

  getTransactionByHash (payload, cb, targetChain) {
    const res = response => {
      if (response.result && !response.result.gasPrice && response.result.maxFeePerGas) {
        return cb({ ...response, result: { ...response.result, gasPrice: response.result.maxFeePerGas } })
      }

      cb(response)
    }

    this.connection.send(payload, res, targetChain)
  }

  sign (payload, res) {
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

    if (!this._isCurrentAccount(from, currentAccount)) return this.resError('sign request is not from currently selected account.', payload, res)

    const handlerId = uuid()
    this.handlers[handlerId] = res

    const req = { handlerId, type: 'sign', payload: normalizedPayload, account: currentAccount.getAccounts[0], origin: payload._origin }

    const _res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }

    accounts.addRequest(req, _res)
  }

  signTypedData (rawPayload, version, res) {
    // v1 has the param order as: [data, address, ...], all other versions have [address, data, ...]
    const orderedParams = version === 'V1'
      ? [rawPayload.params[1], rawPayload.params[0], ...rawPayload.params.slice(2)]
      : [...rawPayload.params]

    const payload = {
      ...rawPayload,
      params: orderedParams
    }

    let [from = '', typedData = {}, ...additionalParams] = payload.params
    const currentAccount = accounts.current()

    if (!this._isCurrentAccount(from, currentAccount)) return this.resError('signTypedData request is not from currently selected account.', payload, res)

    // HACK: Standards clearly say, that second param is an object but it seems like in the wild it can be a JSON-string.
    if (typeof (typedData) === 'string') {
      try {
        typedData = JSON.parse(typedData)
        payload.params = [from, typedData, ...additionalParams]
      } catch (e) {
        return this.resError('Malformed typedData.', payload, res)
      }
    }

    if (
        version !== 'V4' &&
        equalCaseInsensitive((currentAccount.lastSignerType || ''), 'ledger')
      ) {
      return this.resError('Ledger only supports eth_signTypedData_v4+', payload, res)
    }

    const handlerId = uuid()
    this.handlers[handlerId] = res

    accounts.addRequest({ handlerId, type: 'signTypedData', version, payload, account: currentAccount.getAccounts[0], origin: payload._origin })
  }

  subscribe (payload, res) {
    const subId = '0x' + this.randHex(32)
    this.subs[payload.params[0]] = this.subs[payload.params[0]] || []
    this.subs[payload.params[0]].push(subId)
    res({ id: payload.id, jsonrpc: '2.0', result: subId })
  }

  ifSubRemove (id) {
    let found = false
    Object.keys(this.subs).some(type => {
      const index = this.subs[type].indexOf(id)
      found = index > -1
      if (found) this.subs[type].splice(index, 1)
      return found
    })
    return found
  }

  clientVersion (payload, res) {
    res({ id: payload.id, jsonrpc: '2.0', result: `Frame/v${version}` })
  }

  addEthereumChain (payload, res) {
    if (!payload.params[0]) return this.resError('addChain request missing params', payload, res)

    const id = payload.params[0].chainId
    const type = 'ethereum'
    const name = payload.params[0].chainName
    const explorer = payload.params[0].blockExplorerUrls ? payload.params[0].blockExplorerUrls[0] : ''
    const symbol = payload.params[0].nativeCurrency ? payload.params[0].nativeCurrency.symbol : ''
    const rpcUrl = payload.params[0].rpcUrls ? payload.params[0].rpcUrls[0] : ''

    const handlerId = uuid()
    this.handlers[handlerId] = res
    accounts.addRequest({
      handlerId,
      type: 'addChain',
      chain : {
        id,
        type,
        name,
        explorer,
        symbol,
        rpcUrl
      },
      account: accounts.getAccounts()[0],
      origin: payload._origin
    }, res)
  }

  sendAsync (payload, cb) {
    this.send(payload, res => {
      if (res.error) return cb(new Error(res.error))
      cb(null, res)
    })
  }

  send (payload, res = () => {}, targetChain) {
    const method = payload.method || ''

    if (method === 'eth_coinbase') return this.getCoinbase(payload, res)
    if (method === 'eth_accounts') return this.getAccounts(payload, res)
    if (method === 'eth_requestAccounts') return this.getAccounts(payload, res)
    if (method === 'eth_sendTransaction') return this.sendTransaction(payload, res)
    if (method === 'eth_getTransactionByHash') return this.getTransactionByHash(payload, res, targetChain)
    if (method === 'personal_ecRecover') return this.ecRecover(payload, res)
    if (method === 'web3_clientVersion') return this.clientVersion(payload, res)
    if (method === 'eth_subscribe' && this.subs[payload.params[0]]) return this.subscribe(payload, res)
    if (method === 'eth_unsubscribe' && this.ifSubRemove(payload.params[0])) return res({ id: payload.id, jsonrpc: '2.0', result: true }) // Subscription was ours
    if (method === 'eth_sign' || method === 'personal_sign') return this.sign(payload, res)

    const signTypedDataMatcher = /eth_signTypedData_?(v[134]|$)/
    const signTypedDataRequest = method.match(signTypedDataMatcher)

    if (signTypedDataRequest) {
      const version = (signTypedDataRequest[1] || 'v1').toUpperCase()
      return this.signTypedData(payload, version, res)
    }
    
    if (method === 'wallet_addEthereumChain') return this.addEthereumChain(payload, res)

    // Connection dependant methods need to pass targetChain
    if (method === 'net_version') return this.getNetVersion(payload, res, targetChain)
    if (method === 'eth_chainId') return this.getChainId(payload, res, targetChain)

    // Delete custom data
    delete payload._origin

    // Pass everything else to our connection
    this.connection.send(payload, res, targetChain)
  }

  emit(type, ...args) {
    proxy.emit(type, ...args)
    super.emit(type, ...args)
  } 
}

const provider = new Provider()

let network = store('main.currentNetwork.id')
store.observer(() => {
  if (network !== store('main.currentNetwork.id')) {
    network = store('main.currentNetwork.id')
    provider.chainChanged(network)
    provider.networkChanged(network)
  }
})

proxy.on('send', (payload, cd, targetChain) => provider.send(payload, cd, targetChain))
proxy.ready = true
// provider.on('data', data => proxy.emit('data', data))

module.exports = provider

// setTimeout(() => {
//   provider.send({
//     id: 1,
//     jsonrpc: '2.0',
//     method: 'wallet_addEthereumChain',
//     _origin: 'Frame',
//     params: [
//       {
//         chainId: '0x64',
//         chainName: 'xDAI Chain',
//         rpcUrls: ['https://dai.poa.network'],
//         iconUrls: [
//           'https://xdaichain.com/fake/example/url/xdai.svg',
//           'https://xdaichain.com/fake/example/url/xdai.png'
//         ],
//         nativeCurrency: {
//           name: 'xDAI',
//           symbol: 'xDAI',
//           decimals: 18
//         }
//       }
//     ]
//   }, (err, res) => {
//     console.log('Callback from provider.send wallet_addEthereumChain', err, res)
//   })
// }, 9000)
