/* global WebSocket */

const { ipcRenderer } = require('electron')
const { toHex } = require('web3').utils

const { URL } = require('url')
const uuid = require('uuid/v4')
const EventEmitter = require('events')

const rpc = require('../../rpc')
const store = require('../../store')

class Provider extends EventEmitter {
  constructor (url) {
    super()
    this.url = url || store('local.node.default')
    this.store = store
    this.accounts = []
    this.handlers = {}
    this.nodeRequests = {}
    this.count = 1
    this.netVersion = 4
    this.connection = new EventEmitter()
    this.connection.send = (payload, res) => {
      if (!this.connection.socket || this.connection.socket.readyState > 1) return this.resError('Provider Disconnected', payload, res)
      let id = ++this.count
      this.nodeRequests[id] = {originId: payload.id, res}
      payload.id = id
      this.connection.socket.send(JSON.stringify(payload))
    }
    this.connection.on('message', message => {
      if (message.jsonrpc && message.jsonrpc === '2.0') {
        if (!message.id && message.method && message.method.indexOf('_subscription') !== -1) {
          this.emit('data', message)
        } else {
          let reqId = message.id
          if (this.nodeRequests[reqId] && this.nodeRequests[reqId].res) {
            message.id = this.nodeRequests[reqId].originId
            this.nodeRequests[reqId].res(message)
          }
        }
      }
    })
    this.connect()
    rpc('getAccounts', (err, accounts) => { if (!err) this.accounts = accounts })
    ipcRenderer.on('main:accounts', (sender, accounts) => {
      this.accounts = JSON.parse(accounts)
    })
  }
  connect () {
    if (this.url) {
      if (!this.connection.socket || this.connection.socket.readyState > 1) {
        let protocol = (new URL(this.url)).protocol
        if (protocol !== 'ws:' && protocol !== 'wss:') throw new Error('Remote provider must be WebSocket') // For now
        this.connection.socket = new WebSocket(this.url)
        this.connection.socket.addEventListener('open', () => {
          this.store.nodeProvider(true)
        })
        this.connection.socket.addEventListener('close', () => {
          this.connection.socket = null
          setTimeout(_ => this.connect(), 1000)
          this.store.nodeProvider(false)
          this.connection.emit('close')
        })
        // provider.socket.addEventListener('error', err => {})
        this.connection.socket.addEventListener('message', message => {
          if (message.data) this.connection.emit('message', JSON.parse(message.data))
        })
      }
    } else {
      throw new Error('Requested remote provider connection without url')
    }
  }
  getCoinbase (payload, res) {
    rpc('getAccounts', (err, accounts) => {
      if (err) return this.resError(`signTransaction Error: ${JSON.stringify(err)}`, payload, res)
      res({id: payload.id, jsonrpc: payload.jsonrpc, result: accounts[0]})
    })
  }
  getAccounts (payload, res) {
    rpc('getAccounts', (err, accounts) => {
      if (err) return this.resError(`signTransaction Error: ${JSON.stringify(err)}`, payload, res)
      res({id: payload.id, jsonrpc: payload.jsonrpc, result: accounts})
    })
  }
  getNonce (from, res) {
    this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [from, 'latest']}, res)
  }
  getGasPrice (res) {
    this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_gasPrice'}, res)
  }
  getGasEstimate (tx, res) {
    this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_estimateGas', params: [tx]}, res)
  }
  getNetVersion (payload, res) {
    res({id: payload.id, jsonrpc: payload.jsonrpc, result: this.netVersion.toString()})
  }
  unsubscribe (params) {
    this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_unsubscribe', params})
  }
  declineRequest (req) {
    let res = data => { if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data) }
    let payload = req.payload
    this.resError(`user declined transaction`, payload, res)
  }
  resError (error, payload, res) {
    if (typeof error === 'string') error = {message: error, code: -1}
    console.warn(error)
    res({id: payload.id, jsonrpc: payload.jsonrpc, error})
  }
  approveRequest (req, cb) {
    let rawTx = req.data
    let res = data => { if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data) }
    let payload = req.payload
    rpc('signTransaction', rawTx, (err, signedTx) => { // Sign Transaction
      if (err) {
        this.resError(err, payload, res)
        return cb(new Error(`signTransaction Error: ${JSON.stringify(err)}`))
      }
      this.connection.send({id: req.payload.id, jsonrpc: req.payload.jsonrpc, method: 'eth_sendRawTransaction', params: [signedTx]}, (response) => {
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
  sendTransaction (payload, res) {
    let rawTx = payload.params[0] // Todo: Handle mutiple txs
    this.getNonce(rawTx.from, response => { // Todo: Fill in parallel and only what's needed
      if (response.error) return this.resError(`Frame Provider Error while getting nonce: ${response.error.message}`, payload, res)
      let nonce = response.result
      this.getGasPrice(response => {
        if (response.error) return this.resError(`Frame Provider Error while getting gasPrice: ${response.error.message}`, payload, res)
        let gasPrice = response.result
        this.getGasEstimate(rawTx, response => {
          if (response.error) return this.resError(`Frame Provider Error while getting gasEstimate: ${response.error.message}`, payload, res)
          let gas = response.result
          rawTx.nonce = rawTx.nonce || nonce
          rawTx.gasPrice = rawTx.gasPrice || gasPrice
          rawTx.gas = rawTx.gas || rawTx.gasLimit || gas
          delete rawTx.gasLimit
          rawTx = Object.assign(rawTx, {chainId: toHex(this.netVersion)})
          let handlerId = uuid()
          this.store.addRequest({handlerId, type: 'approveTransaction', data: rawTx, payload})
          this.handlers[handlerId] = res
        })
      })
    })
  }
  send (payload, res) {
    if (payload.method === 'eth_coinbase') return this.getCoinbase(payload, res)
    if (payload.method === 'eth_accounts') return this.getAccounts(payload, res)
    if (payload.method === 'eth_sendTransaction') return this.sendTransaction(payload, res)
    if (payload.method === 'net_version') return this.getNetVersion(payload, res)
    if (payload.method === 'eth_sign') return this.resError('Need to handle eth_sign', payload, res)
    if (payload.method === 'personal_sign') return this.resError('Need to handle personal_sign', payload, res)
    if (payload.method === 'personal_ecRecover') return this.resError('Need to handle personal_ecRecover', payload, res)
    this.connection.send(payload, res)
  }
}

module.exports = Provider
