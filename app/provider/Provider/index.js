/* global WebSocket */

const { ipcRenderer } = require('electron')
const Web3 = require('web3')

const { URL } = require('url')
const uuid = require('uuid/v4')
const EventEmitter = require('events')

const rpc = require('../../rpc')
const store = require('../../store')

class Provider {
  constructor (url) {
    this.url = url
    this.store = store
    this.nodeProvider = this.connectNode()
    this.signer = this.getSigner()
    this.accounts = []
    this.handlers = {}
    this.nodeRequests = {}
    this.count = 0
    this.netVersion = 4
    rpc('getAccounts', (err, accounts) => { if (!err) this.accounts = accounts })
    ipcRenderer.on('main:accounts', (sender, accounts) => {
      this.accounts = JSON.parse(accounts)
    })
    this.nodeProvider.on('open', () => this.store.nodeProvider(true))
    this.nodeProvider.on('close', () => this.store.nodeProvider(false))
  }
  connectNode () {
    const nodeProvider = new EventEmitter()
    const connect = (provider, url) => {
      if (!provider.socket || provider.socket.readyState > 1) {
        provider.socket = new WebSocket(url)
        provider.socket.addEventListener('open', () => provider.emit('open'))
        provider.socket.addEventListener('close', () => {
          provider.socket = null
          setTimeout(_ => connect(provider, url), 1000)
          provider.emit('close')
        })
        // provider.socket.addEventListener('error', err => provider.emit('error', err))
        provider.socket.addEventListener('message', message => {
          if (message.data) provider.emit('message', JSON.parse(message.data))
        })
      }
    }
    if (this.url) {
      let protocol = (new URL(this.url)).protocol
      if (protocol !== 'ws:' && protocol !== 'wss:') throw new Error('Remote provider must be WebSocket') // For now
      connect(nodeProvider, this.url)
      nodeProvider.sendNode = (payload, cb) => {
        if (!nodeProvider.socket || nodeProvider.socket.readyState > 1) return cb(new Error('Provider Disconnected'))
        let id = ++this.count
        this.nodeRequests[id] = {originId: payload.id, cb}
        payload.id = id
        nodeProvider.socket.send(JSON.stringify(payload))
      }
      nodeProvider.on('message', message => {
        if (message.jsonrpc && message.jsonrpc === '2.0') {
          if (!message.id && message.method.indexOf('_subscription') !== -1) {
            // Handle subscriptions
          } else {
            let requestId = message.id
            if (this.nodeRequests[requestId]) {
              message.id = this.nodeRequests[requestId].originId
              this.nodeRequests[requestId].cb(message.error, message)
            }
          }
        }
      })
    } else {
      throw new Error('Requested remote provider connection without url.')
    }
    return nodeProvider
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
  getSigner () {
  }
  getNonce (from, cb) {
    this.nodeProvider.sendNode({id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [from, 'latest']}, cb)
  }
  getGasPrice (cb) {
    this.nodeProvider.sendNode({id: 1, jsonrpc: '2.0', method: 'eth_gasPrice'}, cb)
  }
  getNetVersion (payload, cb) {
    cb(null, {id: payload.id, jsonrpc: payload.jsonrpc, result: this.netVersion.toString()})
  }
  approveRequest (req, cb) {
    let rawTx = req.data
    rpc('signTransaction', rawTx, (err, signedTx) => { // Sign Transaction
      if (err) {
        if (this.handlers[req.handlerId]) this.handlers[req.handlerId](err)
        return cb(new Error(`signTransaction Error: ${JSON.stringify(err)}`))
      }
      this.nodeProvider.sendNode({id: req.id, jsonrpc: req.jsonrpc, method: 'eth_sendRawTransaction', params: [signedTx]}, (err, message) => {
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
    if (payload.method === 'eth_subscribe') return warn('Need to handle eth_subscribe', cb)
    if (payload.method === 'eth_sign') return warn('Need to handle eth_sign', cb)
    if (payload.method === 'personal_sign') return warn('Need to handle personal_sign', cb)
    if (payload.method === 'personal_ecRecover') return warn('Need to handle personal_ecRecover', cb)
    this.nodeProvider.sendNode(payload, cb)
  }
}

module.exports = Provider
