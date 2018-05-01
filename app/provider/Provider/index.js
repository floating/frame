/* global WebSocket */

const { ipcRenderer } = require('electron')
const Web3 = require('web3')

const { URL } = require('url')
const uuid = require('uuid/v4')
const EventEmitter = require('events')

const rpc = require('../../rpc')
const store = require('../../store')

class Provider extends EventEmitter {
  constructor (url) {
    super()
    this.url = url
    this.store = store
    this.accounts = []
    this.handlers = {}
    this.nodeRequests = {}
    this.count = 0
    this.netVersion = 4
    this.connection = new EventEmitter()
    this.connection.send = (payload, cb) => {
      if (!this.connection.socket || this.connection.socket.readyState > 1) return cb(new Error('Provider Disconnected'))
      let id = ++this.count
      this.nodeRequests[id] = {originId: payload.id, cb}
      payload.id = id
      this.connection.socket.send(JSON.stringify(payload))
    }
    this.connection.on('message', message => {
      if (message.jsonrpc && message.jsonrpc === '2.0') {
        if (!message.id && message.method.indexOf('_subscription') !== -1) {
          this.emit('data', message)
        } else {
          let requestId = message.id
          if (this.nodeRequests[requestId] && this.nodeRequests[requestId].cb) {
            message.id = this.nodeRequests[requestId].originId
            this.nodeRequests[requestId].cb(message.error, message)
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
  getCoinbase (payload, cb) {
    rpc('getAccounts', (err, accounts) => {
      if (err) return cb(new Error(`signTransaction Error: ${JSON.stringify(err)}`))
      cb(null, {id: payload.id, jsonrpc: payload.jsonrpc, result: accounts[0]})
    })
  }
  getAccounts (payload, cb) {
    rpc('getAccounts', (err, accounts) => {
      if (err) return cb(JSON.stringify(err))
      cb(null, {id: payload.id, jsonrpc: payload.jsonrpc, result: accounts})
    })
  }
  getNonce (from, cb) {
    this.connection.send({id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [from, 'latest']}, cb)
  }
  getGasPrice (cb) {
    this.connection.send({id: 1, jsonrpc: '2.0', method: 'eth_gasPrice'}, cb)
  }
  getNetVersion (payload, cb) {
    cb(null, {id: payload.id, jsonrpc: payload.jsonrpc, result: this.netVersion.toString()})
  }
  unsubscribe (params) {
    this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_unsubscribe', params})
  }
  approveRequest (req, cb) {
    let rawTx = req.data
    rpc('signTransaction', rawTx, (err, signedTx) => { // Sign Transaction
      if (err) {
        if (this.handlers[req.handlerId]) this.handlers[req.handlerId](err)
        return cb(new Error(`signTransaction Error: ${JSON.stringify(err)}`))
      }
      this.connection.send({id: req.id, jsonrpc: req.jsonrpc, method: 'eth_sendRawTransaction', params: [signedTx]}, (err, message) => {
        if (err) {
          if (this.handlers[req.handlerId]) this.handlers[req.handlerId](err)
          cb(err.message)
          return
        }
        if (this.handlers[req.handlerId]) this.handlers[req.handlerId](null, message)
        cb(null, message.result)
      })
    })
  }
  sendTransaction (payload, cb) {
    let rawTx = payload.params[0]
    this.getNonce(rawTx.from, (err, nonce) => {
      if (err || nonce.error) return cb(new Error(`Frame Provider Error while getting nonce: ${err || nonce.error}`))
      nonce = nonce.result
      this.getGasPrice((err, gasPrice) => {
        if (err || gasPrice.error) return cb(new Error(`Frame Provider Error while getting nonce: ${err || gasPrice.error}`))
        gasPrice = gasPrice.result
        rawTx = Object.assign({nonce, gasPrice}, payload.params[0], {chainId: Web3.utils.toHex(this.netVersion)})
        let handlerId = uuid()
        this.store.addRequest({handlerId, type: 'approveTransaction', data: rawTx, id: payload.id, jsonrpc: payload.jsonrpc})
        this.handlers[handlerId] = cb
      })
    })
  }
  sendAsync (payload, cb) {
    let warn = (err, cb) => {
      console.warn(err)
      cb(err)
    }
    if (payload.method === 'eth_coinbase') return this.getCoinbase(payload, cb)
    if (payload.method === 'eth_accounts') return this.getAccounts(payload, cb)
    if (payload.method === 'eth_sendTransaction') return this.sendTransaction(payload, cb)
    if (payload.method === 'net_version') return this.getNetVersion(payload, cb)
    if (payload.method === 'eth_sign') return warn('Need to handle eth_sign', cb)
    if (payload.method === 'personal_sign') return warn('Need to handle personal_sign', cb)
    if (payload.method === 'personal_ecRecover') return warn('Need to handle personal_ecRecover', cb)
    this.connection.send(payload, cb)
  }
}

module.exports = Provider
