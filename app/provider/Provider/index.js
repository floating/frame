const { ipcRenderer } = require('electron')
const Web3 = require('web3')

const { URL } = require('url')
const uuid = require('uuid/v4')

const WSProvider = require('web3-providers-ws')
const HTTPProvider = require('web3-providers-http')

const rpc = require('../../rpc')
const store = require('../../store')

class Provider {
  constructor (url) {
    this.url = url
    this.store = store
    this.provider = this.createProvider()
    this.signer = this.getSigner()
    this.accounts = []
    this.handlers = {}
    this.netVersion = 4
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
    if (this.url) {
      let protocol = (new URL(this.url)).protocol
      if (protocol === 'http:' || protocol === 'https:') return new HTTPProvider(this.url)
      if (protocol === 'ws:' || protocol === 'wss:') return new WSProvider(this.url)
      // return new IPCProvider()
    } else {
      throw new Error('Requested remote provider connection without url.')
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
      rawTx = Object.assign({nonce}, payload.params[0], {chainId: Web3.utils.toHex(this.netVersion)})
      let handlerId = uuid()
      this.store.addRequest({handlerId, type: 'approveTransaction', data: rawTx, id: payload.id, jsonrpc: payload.jsonrpc})
      this.handlers[handlerId] = cb
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
    if (payload.method === 'net_version') return this.getNetVersion(payload, cb)
    this.provider.send(payload, cb)
  }
}

module.exports = Provider
