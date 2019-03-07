const uuid = require('uuid/v4')
const EventEmitter = require('events')
const log = require('electron-log')
const utils = require('web3-utils')
const { pubToAddress, ecrecover, hashPersonalMessage, toBuffer } = require('ethereumjs-util')
const store = require('../store')
const nodes = require('../nodes')
const signers = require('../signers')
const version = require('../../package.json').version

class Provider extends EventEmitter {
  constructor () {
    super()
    this.store = store
    this.handlers = {}
    this.nonce = {}
    this.connected = false
    this.connection = nodes
    this.connection.on('connect', () => { this.connected = true })
    this.connection.on('close', () => { this.connected = false })
    this.connection.on('data', data => this.emit('data', data))
    this.connection.on('error', err => log.error(err))
    this.getGasPrice = this.getGasPrice.bind(this)
    this.getGasEstimate = this.getGasEstimate.bind(this)
    this.getNonce = this.getNonce.bind(this)
    this.fillTx = this.fillTx.bind(this)
    this.subs = { accountsChanged: [], networkChanged: [] }
  }
  accountsChanged (accounts) {
    this.subs.accountsChanged.forEach(subscription => {
      this.emit('data:accounts', accounts[0], { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: accounts } })
    })
  }
  networkChanged (netId) {
    this.subs.networkChanged.forEach(subscription => {
      this.emit('data', { method: 'eth_subscription', jsonrpc: '2.0', params: { subscription, result: netId } })
    })
  }
  randHex (len) {
    let maxlen = 8
    let min = Math.pow(16, Math.min(len, maxlen) - 1)
    let max = Math.pow(16, Math.min(len, maxlen)) - 1
    let n = Math.floor(Math.random() * (max - min + 1)) + min
    let r = n.toString(16)
    while (r.length < len) r = r + this.randHex(len - maxlen)
    return r
  }
  getCoinbase (payload, res) {
    signers.getAccounts((err, accounts) => {
      if (err) return this.resError(`signTransaction Error: ${JSON.stringify(err)}`, payload, res)
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: accounts[0] })
    })
  }
  getAccounts (payload, res) {
    res({ id: payload.id, jsonrpc: payload.jsonrpc, result: signers.getSelectedAccounts().map(a => a.toLowerCase()) })
  }
  getNetVersion (payload, res) {
    this.connection.send(payload, (response) => {
      if (response.error) return res({ id: payload.id, jsonrpc: payload.jsonrpc, error: response.error })
      if (response.result !== store('main.connection.network')) this.resError('Network mismatch', payload, res)
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: response.result })
    })
  }
  declineRequest (req) {
    let res = data => { if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data) }
    let payload = req.payload
    this.resError(`User declined transaction`, payload, res)
  }
  resError (error, payload, res) {
    if (typeof error === 'string') error = { message: error, code: -1 }
    log.warn(error)
    res({ id: payload.id, jsonrpc: payload.jsonrpc, error: error.message })
  }
  getSignedAddress (signed, message, cb) {
    const signature = Buffer.from(signed.replace('0x', ''), 'hex')
    if (signature.length !== 65) cb(new Error(`Frame verifySignature: Signature has incorrect length`))
    let v = signature[64]
    v = v === 0 || v === 1 ? v + 27 : v
    let r = toBuffer(signature.slice(0, 32))
    let s = toBuffer(signature.slice(32, 64))
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
    this.getSignedAddress(signed, message, (err, verifiedAddress) => {
      if (err) return cb(err)
      if (verifiedAddress !== address) return cb(new Error(`Frame verifySignature: Failed ecRecover check`))
      cb(null, true)
    })
  }
  approveSign (req, cb) {
    let res = data => { if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data) }
    let payload = req.payload
    let address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]
    let message = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0]
    signers.signMessage(address, message, (err, signed) => {
      if (err) {
        this.resError(err.message, payload, res)
        cb(err.message)
      } else {
        this.verifySignature(signed, message, address, (err, success) => {
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
  signAndSend (req, cb) {
    let rawTx = req.data
    let res = data => { if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data) }
    let payload = req.payload
    signers.signTransaction(rawTx, (err, signedTx) => { // Sign Transaction
      if (err) {
        this.resError(err, payload, res)
        return cb(new Error(err))
      }
      this.connection.send({ id: req.payload.id, jsonrpc: req.payload.jsonrpc, method: 'eth_sendRawTransaction', params: [signedTx] }, (response) => {
        if (response.error) {
          this.resError(response.error, payload, res)
          cb(response.error.message)
        } else {
          res(response)
          cb(null, response.result)
        }
      })
    })
  }
  approveRequest (req, cb) {
    if (req.data.nonce) return this.signAndSend(req, cb)
    this.getNonce(req.data, response => {
      if (response.error) return cb(response.error)
      let updatedReq = Object.assign({}, req)
      updatedReq.data = Object.assign({}, updatedReq.data, { nonce: response.result })
      this.signAndSend(updatedReq, cb)
    })
  }
  getRawTx (payload) {
    let rawTx = payload.params[0]
    rawTx.gas = rawTx.gas || rawTx.gasLimit
    delete rawTx.gasLimit
    return rawTx
  }
  getGasPrice (rawTx, res) {
    this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_gasPrice' }, res)
  }
  getGasEstimate (rawTx, res) {
    this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_estimateGas', params: [rawTx] }, res)
  }
  getNonce (rawTx, res) {
    if (this.nonce.age && Date.now() - this.nonce.age < 30 * 1000 && this.nonce.account === rawTx.from && this.nonce.current) {
      let newNonce = utils.hexToNumber(this.nonce.current)
      newNonce++
      newNonce = utils.numberToHex(newNonce)
      this.nonce = { age: Date.now(), current: newNonce }
      res({ id: 1, jsonrpc: '2.0', result: this.nonce.current })
    } else {
      this.connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [rawTx.from, 'pending'] }, (response) => {
        if (response.result) this.nonce = { age: Date.now(), current: response.result, account: rawTx.from }
        res(response)
      })
    }
  }
  fillTx (rawTx, cb) {
    let needs = {}
    // if (!rawTx.nonce) needs.nonce = this.getNonce
    if (!rawTx.gasPrice) needs.gasPrice = this.getGasPrice
    if (!rawTx.gas) needs.gas = this.getGasEstimate
    let count = 0
    let list = Object.keys(needs)
    let errors = []
    if (list.length > 0) {
      list.forEach(need => {
        needs[need](rawTx, response => {
          if (response.error) {
            errors.push({ need, message: response.error.message })
          } else {
            rawTx[need] = response.result
          }
          if (++count === list.length) errors.length > 0 ? cb(errors[0]) : cb(null, rawTx)
        })
      })
    } else {
      cb(null, rawTx)
    }
  }
  sendTransaction (payload, res) {
    let rawTx = this.getRawTx(payload)
    this.fillTx(rawTx, (err, rawTx) => {
      if (err) return this.resError(`Frame provider error while getting ${err.need}: ${err.message}`, payload, res)
      if (!rawTx.chainId) rawTx.chainId = utils.toHex(store('main.connection.network'))
      let from = rawTx.from
      let current = signers.getAccounts()[0]
      if (from && current && from.toLowerCase() !== current.toLowerCase()) return this.resError('Transaction is not from currently selected account', payload, res)
      let handlerId = uuid()
      this.handlers[handlerId] = res
      signers.addRequest({ handlerId, type: 'transaction', data: rawTx, payload, account: signers.getAccounts()[0] }, res)
    })
  }
  ethSign (payload, res) {
    let handlerId = uuid()
    this.handlers[handlerId] = res
    signers.addRequest({ handlerId, type: 'sign', payload, account: signers.getAccounts()[0] })
  }
  subscribe (payload, res) {
    let subId = '0x' + this.randHex(32)
    this.subs[payload.params[0]] = this.subs[payload.params[0]] || []
    this.subs[payload.params[0]].push(subId)
    res({ id: payload.id, jsonrpc: '2.0', result: subId })
  }
  ifSubRemove (id) {
    let found = false
    Object.keys(this.subs).some(type => {
      let index = this.subs[type].indexOf(id)
      found = index > -1
      if (found) this.subs[type].splice(index, 1)
      return found
    })
    return found
  }
  clientVersion (payload, res) {
    res({ id: payload.id, jsonrpc: '2.0', result: `Frame/v${version}` })
  }
  send (payload, res = () => {}) {
    if (payload.method === 'eth_coinbase') return this.getCoinbase(payload, res)
    if (payload.method === 'eth_accounts') return this.getAccounts(payload, res)
    if (payload.method === 'eth_sendTransaction') return this.sendTransaction(payload, res)
    if (payload.method === 'net_version') return this.getNetVersion(payload, res)
    if (payload.method === 'personal_ecRecover') return this.ecRecover(payload, res)
    if (payload.method === 'web3_clientVersion') return this.clientVersion(payload, res)
    if (payload.method === 'eth_sign' || payload.method === 'personal_sign') return this.ethSign(payload, res)
    if (payload.method === 'eth_subscribe' && this.subs[payload.params[0]]) return this.subscribe(payload, res)
    if (payload.method === 'eth_unsubscribe' && this.ifSubRemove(payload.params[0])) return res({ id: payload.id, jsonrpc: '2.0', result: true }) // Subscription was ours
    this.connection.send(payload, res)
  }
}

const provider = new Provider()

let network = store('main.connection.network')
store.observer(() => {
  if (network !== store('main.connection.network')) {
    network = store('main.connection.network')
    signers.unsetSigner()
    provider.networkChanged(network)
    provider.accountsChanged([])
  }
})

module.exports = provider
