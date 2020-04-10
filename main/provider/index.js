const { v4: uuid } = require('uuid')
const EventEmitter = require('events')
const log = require('electron-log')
const utils = require('web3-utils')
const { pubToAddress, ecrecover, hashPersonalMessage, toBuffer } = require('ethereumjs-util')

const proxy = require('./proxy')

const store = require('../store')
const nodes = require('../nodes')
const accounts = require('../accounts')
const { recoverTypedData } = require('../crypt/typedDataUtils')

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

  getNetVersion (payload, res) {
    this.connection.send(payload, (response) => {
      if (response.error) return res({ id: payload.id, jsonrpc: payload.jsonrpc, error: response.error })
      if (response.result !== store('main.connection.network')) this.resError('Network mismatch', payload, res)
      res({ id: payload.id, jsonrpc: payload.jsonrpc, result: response.result })
    })
  }

  declineRequest (req) {
    const res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }
    const payload = req.payload
    this.resError('User declined transaction', payload, res)
  }

  resError (error, payload, res) {
    if (typeof error === 'string') error = { message: error, code: -1 }
    log.warn(error)
    res({ id: payload.id, jsonrpc: payload.jsonrpc, error: error.message })
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
        address = accounts.get(actor.id).addresses[actor.index]
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
    const address = payload.method === 'eth_sign' ? payload.params[0] : payload.params[1]
    const message = payload.method === 'eth_sign' ? payload.params[1] : payload.params[0]
    accounts.signMessage(address, message, (err, signed) => {
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

  approveSignTypedData (req, cb) {
    const res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }
    const payload = req.payload
    const [address, typedData] = payload.params

    accounts.signTypedData(address, typedData, (err, signed) => {
      if (err) {
        this.resError(err.message, payload, res)
        cb(err.message)
      } else {
        const recoveredAddress = recoverTypedData(typedData, signed)
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
          const err = new Error('TypedData signature verification failed')
          this.resError(err.message, { ...payload, recoveredAddress }, res)
          cb(err.message)
        } else {
          res({ id: payload.id, jsonrpc: payload.jsonrpc, result: signed })
          cb(null, signed)
        }
      }
    })
  }

  signAndSend (req, cb) {
    const rawTx = req.data
    const res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }
    const payload = req.payload
    console.log('SIGN THIS', rawTx)
    accounts.signTransaction(rawTx, (err, signedTx) => { // Sign Transaction
      console.log('SIGNED TX', signedTx)
      if (err) {
        this.resError(err, payload, res)
        cb(new Error(err))
      } else {
        accounts.setTxSigned(req.handlerId, err => {
          if (err) return cb(err)
          this.connection.send({ id: req.payload.id, jsonrpc: req.payload.jsonrpc, method: 'eth_sendRawTransaction', params: [signedTx] }, response => {
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
    })
  }

  approveRequest (req, cb) {
    if (req.data.nonce) return this.signAndSend(req, cb)
    this.getNonce(req.data, response => {
      if (response.error) return cb(response.error)
      const updatedReq = Object.assign({}, req)
      updatedReq.data = Object.assign({}, updatedReq.data, { nonce: response.result })
      this.signAndSend(updatedReq, cb)
    })
  }

  getRawTx (payload) {
    const rawTx = payload.params[0]
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

  fillDone (fullTx, res) {
    this.getGasPrice(fullTx, response => {
      if (response.error) return res({ need: 'gasPrice', message: response.error.message })
      const gasPrice = store('main.gasPrice')
      // const minGas = '0x' + (Math.floor(response.result * 1.2)).toString(16)
      // if (!fullTx.gasPrice) fullTx.gasPrice = defaultGas
      const defaultGas = gasPrice.levels[gasPrice.default]
      fullTx.gasPrice = defaultGas
      res(null, fullTx)
    })
  }

  fillTx (rawTx, cb) {
    const needs = {}
    // if (!rawTx.nonce) needs.nonce = this.getNonce
    // if (!rawTx.gasPrice) needs.gasPrice = this.getGasPrice
    if (!rawTx.gas) needs.gas = this.getGasEstimate
    let count = 0
    const list = Object.keys(needs)
    const errors = []
    if (list.length > 0) {
      list.forEach(need => {
        needs[need](rawTx, response => {
          if (response.error) {
            errors.push({ need, message: response.error.message })
          } else {
            rawTx[need] = response.result
          }
          if (++count === list.length) errors.length > 0 ? cb(errors[0]) : this.fillDone(rawTx, cb)
        })
      })
    } else {
      this.fillDone(rawTx, cb)
    }
  }

  sendTransaction (payload, res) {
    const rawTx = this.getRawTx(payload)
    this.fillTx(rawTx, (err, rawTx) => {
      if (err) return this.resError(`Frame provider error while getting ${err.need}: ${err.message}`, payload, res)
      if (!rawTx.chainId) rawTx.chainId = utils.toHex(store('main.connection.network'))
      const from = rawTx.from
      const current = accounts.getAccounts()[0]
      if (from && current && from.toLowerCase() !== current.toLowerCase()) return this.resError('Transaction is not from currently selected account', payload, res)
      const handlerId = uuid()
      this.handlers[handlerId] = res
      // console.log(payload)
      accounts.addRequest({ handlerId, type: 'transaction', data: rawTx, payload, account: accounts.getAccounts()[0], origin: payload._origin }, res)
    })
  }

  ethSign (payload, res) {
    payload.params = [payload.params[0], payload.params[1]]
    if (!payload.params.every(utils.isHexStrict)) return this.resError('ethSign Error: Invalid hex values', payload, res)
    const handlerId = uuid()
    this.handlers[handlerId] = res
    const req = { handlerId, type: 'sign', payload, account: accounts.getAccounts()[0], origin: payload._origin }
    const _res = data => {
      if (this.handlers[req.handlerId]) this.handlers[req.handlerId](data)
      delete this.handlers[req.handlerId]
    }
    accounts.addRequest(req, _res)
  }

  signTypedData (payload, res) {
    let [from = '', typedData = {}, ...rest] = payload.params
    const current = accounts.getAccounts()[0]
    if (from.toLowerCase() !== current.toLowerCase()) return this.resError('signTypedData request is not from currently selected account.', payload, res)

    // HACK: Standards clearly say, that second param is an object but it seems like in the wild it can be a JSON-string.
    if (typeof (typedData) === 'string') {
      try {
        typedData = JSON.parse(typedData)
        payload.params = [from, typedData, ...rest]
      } catch (e) {
        return this.resError('Malformed typedData.', payload, res)
      }
    }
    const handlerId = uuid()
    this.handlers[handlerId] = res
    accounts.addRequest({ handlerId, type: 'signTypedData', payload, account: accounts.getAccounts()[0], origin: payload._origin })
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

  sendAsync (payload, cb) {
    this.send(payload, res => {
      if (res.error) return cb(new Error(res.error))
      cb(null, res)
    })
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
    if (payload.method === 'eth_signTypedData' || payload.method === 'eth_signTypedData_v3') return this.signTypedData(payload, res)
    // Delete custom data
    delete payload._origin
    this.connection.send(payload, res)
  }
}

const provider = new Provider()

let network = store('main.connection.network')
store.observer(() => {
  if (network !== store('main.connection.network')) {
    network = store('main.connection.network')
    accounts.unsetSigner()
    provider.networkChanged(network)
    provider.accountsChanged([])
  }
})

proxy.on('send', (payload, cd) => provider.send(payload, cd))
provider.on('data', data => proxy.emit('data', data))

module.exports = provider
