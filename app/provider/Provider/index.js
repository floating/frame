const { ipcRenderer } = require('electron')
const Web3 = require('web3')

const { URL } = require('url')
const uuid = require('uuid/v4')

const WSProvider = require('web3-providers-ws')
const HTTPProvider = require('web3-providers-http')
const IPCProvider = require('web3-providers-ipc')

const rpc = require('../../rpc')
const store = require('../../store')

class Provider {
  constructor (location) {
    this.location = location
    this.store = store
    this.provider = this.createProvider()
    this.signer = this.getSigner()
    this.accounts = []
    this.handlers = {}
    rpc('getAccounts', (err, accounts) => {
      if (err) return
      this.accounts = accounts
    })
    ipcRenderer.on('main:accounts', (sender, accounts) => {
      this.accounts = JSON.parse(accounts)
    })
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
  createProvider () {
    if (this.location) {
      let protocol = (new URL(this.location)).protocol
      if (protocol === 'http:' || protocol === 'https:') return new HTTPProvider(this.location)
      if (protocol === 'ws:' || protocol === 'wss:') return new WSProvider(this.location)
      return new IPCProvider(this.location)
    } else {
      throw new Error('Requested provider connection without setting provider location.')
    }
  }
  getSigner () {
  }
  getNonce (from, cb) {
    this.provider.send({id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [from, 'latest']}, cb)
  }
  getGasPrice (cb) {
    this.provider.send({id: 1, jsonrpc: '2.0', method: 'eth_gasPrice'}, cb)
  }
  approveRequest (req, cb) {
    let rawTx = Object.assign({}, req.data, {handlerId: req.handlerId})
    rpc('signTransaction', rawTx, (err, signedTx) => { // Sign Transaction
      if (err) {
        if (this.handlers[req.handlerId]) this.handlers[req.handlerId](err)
        return cb(new Error(`signTransaction Error: ${JSON.stringify(err)}`))
      }
      this.provider.send({id: req.id, jsonrpc: req.jsonrpc, method: 'eth_sendRawTransaction', params: [signedTx]}, (err, res) => {
        if (err) {
          if (this.handlers[req.handlerId]) this.handlers[req.handlerId](err)
          cb(err.message)
          return
        }
        if (this.handlers[req.handlerId]) this.handlers[req.handlerId](null, res)
        cb(null, res.result)
      })
    })
  }
  sendTransaction (payload, cb) {
    let rawTx = payload.params[0]
    this.getNonce(rawTx.from, (err, nonce) => {
      err = err || nonce.error
      if (err) return cb(new Error(`Frame Provider Error: while getting nonce: ${err}`))
      nonce = nonce.result
      this.getGasPrice((err, gasPrice) => {
        err = err || gasPrice.error
        if (err) return cb(new Error(`Frame Provider: while getting gasPrice: ${err}`))
        gasPrice = gasPrice.result
        rawTx = Object.assign({nonce, gasPrice}, payload.params[0], {chainId: Web3.utils.toHex(4)})
        let handlerId = uuid()
        this.store.addRequest({handlerId, type: 'approveTransaction', data: rawTx, id: payload.id, jsonrpc: payload.jsonrpc})
        this.handlers[handlerId] = cb
      })
    })
  }
  sendAsync (payload, cb) {
    this.store.addProviderEvent(payload)
    let warn = (err, cb) => {
      console.warn(err)
      cb(err)
    }
    if (payload.method === 'eth_coinbase') return this.getCoinbase(payload, cb)
    if (payload.method === 'eth_accounts') return this.getAccounts(payload, cb)
    if (payload.method === 'eth_sendTransaction') return this.sendTransaction(payload, cb)
    if (payload.method === 'eth_sign') return warn('Need to handle eth_sign', cb)
    if (payload.method === 'personal_sign') return warn('Need to handle personal_sign', cb)
    if (payload.method === 'personal_ecRecover') return warn('Need to handle personal_ecRecover', cb)
    this.provider.send(payload, cb)
  }
}

module.exports = Provider
