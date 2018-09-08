import uuid from 'uuid/v4'
import EventEmitter from 'events'
import log from 'electron-log'
import utils from 'web3-utils'
import { pubToAddress, ecrecover, hashPersonalMessage, toBuffer } from 'ethereumjs-util'

import rpc from '../rpc'
import store from '../store'
import nodes from '../nodes'

// import iso from '../iso'

class Provider extends EventEmitter {
  constructor () {
    super()
    this.store = store
    this.handlers = {}
    this.nonce = {}
    this.connection = nodes
    this.connection.on('data', data => this.emit('data', data))
    this.connection.on('error', err => log.error(err))
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
      res({id: payload.id, jsonrpc: payload.jsonrpc, result: accounts.map(a => a.toLowerCase())})
    })
  }
  getNetVersion (payload, res) {
    res({id: payload.id, jsonrpc: payload.jsonrpc, result: store('local.connection.network')})
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
  signAndSend (req, cb) {
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
  approveRequest (req, cb) {
    if (req.data.nonce) return this.signAndSend(req, cb)
    this.getNonce(req.data, response => {
      if (response.error) return cb(response.error)
      let updatedReq = Object.assign({}, req)
      updatedReq.data = Object.assign({}, updatedReq.data, {nonce: response.result})
      this.signAndSend(updatedReq, cb)
    })
  }
  getRawTx (payload) {
    let rawTx = payload.params[0]
    rawTx.gas = rawTx.gas || rawTx.gasLimit
    delete rawTx.gasLimit
    return rawTx
  }
  getGasPrice = (rawTx, res) => this.connection.send({id: 1, jsonrpc: '2.0', method: 'eth_gasPrice'}, res)
  getGasEstimate = (rawTx, res) => this.connection.send({id: 1, jsonrpc: '2.0', method: 'eth_estimateGas', params: [rawTx]}, res)
  getNonce = (rawTx, res) => {
    if (this.nonce.age && Date.now() - this.nonce.age < 30 * 1000 && this.nonce.account === rawTx.from && this.nonce.current) {
      let newNonce = utils.hexToNumber(this.nonce.current)
      newNonce++
      newNonce = utils.numberToHex(newNonce)
      this.nonce = {age: Date.now(), current: newNonce}
      res({id: 1, jsonrpc: '2.0', result: this.nonce.current})
    } else {
      this.connection.send({id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [rawTx.from, 'pending']}, (response) => {
        if (response.result) this.nonce = {age: Date.now(), current: response.result, account: rawTx.from}
        res(response)
      })
    }
  }
  fillTx = (rawTx, cb) => {
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
      if (!rawTx.chainId) rawTx.chainId = utils.toHex(store('local.connection.network'))
      let handlerId = uuid()
      this.iso.action('addRequest', {handlerId, type: 'approveTransaction', data: rawTx, payload})
      this.handlers[handlerId] = res
    })
  }
  signPersonal (payload, res) {
    rpc('signPersonal', payload.params[0], payload.params[1], (err, signed) => {
      if (err) return this.resError(`Frame provider error during signPersonal: ${err.message}`, payload, res)
      res({id: payload.id, jsonrpc: payload.jsonrpc, result: signed})
    })
  }
  ecRecover (payload, res) {
    const message = payload.params[0]
    const signature = Buffer.from(payload.params[1].replace('0x', ''), 'hex')
    if (signature.length !== 65) this.resError(`Frame provider error during ecRecover: Signature has incorrect length`, payload, res)
    let v = signature[64]
    v = v === 0 || v === 1 ? v + 27 : v
    let r = toBuffer(signature.slice(0, 32))
    let s = toBuffer(signature.slice(32, 64))
    const hash = hashPersonalMessage(toBuffer(message))
    const address = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
    res({id: payload.id, jsonrpc: payload.jsonrpc, result: address})
  }
  send (payload, res) {
    if (payload.method === 'eth_coinbase') return this.getCoinbase(payload, res)
    if (payload.method === 'eth_accounts') return this.getAccounts(payload, res)
    if (payload.method === 'eth_sendTransaction') return this.sendTransaction(payload, res)
    if (payload.method === 'net_version') return this.getNetVersion(payload, res)
    if (payload.method === 'personal_sign') return this.signPersonal(payload, res)
    if (payload.method === 'personal_ecRecover') return this.ecRecover(payload, res)
    if (payload.method === 'eth_sign') return this.resError('No eth_sign', payload, res)
    this.connection.send(payload, res)
  }
}

const provider = new Provider()

// Replace events with observers
// store.events.on('approveRequest', (id, req) => {
//   store.requestPending(id)
//   provider.approveRequest(req, (err, res) => {
//     if (err) return store.requestError(id, err)
//     store.requestSuccess(id, res)
//   })
// })
//
// store.events.on('declineRequest', (id, req) => {
//   store.declineRequest(id)
//   provider.declineRequest(req)
// })

export default provider
