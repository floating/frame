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
    this.nonceTrack = {}
    this.nodeRequests = {}
    this.count = 1
    this.netVersion = 4
    this.connection = new EventEmitter()
    this.connection.send = (payload, res) => {
      if (!this.connection.socket || this.connection.socket.readyState > 1) return this.resError('Provider Disconnected', payload, res)
      let id = ++this.count
      this.nodeRequests[id] = {originId: payload.id, res}
      payload.id = id
      this.connection.socket.send(JSON.stringify(payload), err => { if (err) console.log(err) })
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
        this.connection.socket.addEventListener('error', err => console.log('Provider Socket Error', err))
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
  getNetVersion (payload, res) {
    res({id: payload.id, jsonrpc: payload.jsonrpc, result: this.netVersion.toString()})
  }
  unsubscribe (params, res) {
    this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_unsubscribe', params}, res)
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
  getRawTx (payload) {
    let rawTx = payload.params[0] // Todo: Handle mutiple txs
    rawTx.gas = rawTx.gas || rawTx.gasLimit
    delete rawTx.gasLimit
    return rawTx
  }
  getNonce = (rawTx, res) => {
    if (this.nonceTrack[rawTx.from] && Date.now() - this.nonceTrack[rawTx.from].time < 30 * 1000) return res({id: 1, jsonrpc: '2.0', result: toHex(++this.nonceTrack[rawTx.from].current)})
    if (this.nonceLock) return setTimeout(() => this.getNonce(rawTx, res), 200)
    this.nonceLock = true
    this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [rawTx.from, 'latest']}, response => {
      if (response.result) this.nonceTrack[rawTx.from] = {current: response.result, time: Date.now()}
      this.nonceLock = false
      res(response)
    })
  }
  getGasPrice = (rawTx, res) => this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_gasPrice'}, res)
  getGasEstimate = (rawTx, res) => this.connection.send({id: ++this.count, jsonrpc: '2.0', method: 'eth_estimateGas', params: [rawTx]}, res)
  fillTx = (rawTx, cb) => {
    let needs = {}
    if (!rawTx.nonce) needs.nonce = this.getNonce
    if (!rawTx.gasPrice) needs.gasPrice = this.getGasPrice
    if (!rawTx.gas) needs.gas = this.getGasEstimate
    let count = 0
    let list = Object.keys(needs)
    let errors = []
    if (list.length > 0) {
      list.forEach(need => {
        needs[need](rawTx, response => {
          if (response.error) {
            errors.push({need, message: response.error.message})
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
      rawTx = Object.assign(rawTx, {chainId: toHex(this.netVersion)}) // In the future, check for chainId mismatch instead of clobber
      let handlerId = uuid()
      this.store.addRequest({handlerId, type: 'approveTransaction', data: rawTx, payload})
      this.handlers[handlerId] = res
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
