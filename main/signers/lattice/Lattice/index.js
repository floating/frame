const crypto = require('crypto')
const log = require('electron-log')
const utils = require('web3-utils')
const EthereumTx = require('ethereumjs-tx')
const { Client } = require('gridplus-sdk')
const { promisify } = require('util')

const store = require('../../../store')
const Signer = require('../../Signer')

const HARDENED_OFFSET = 0x80000000

function humanReadable (str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) < 0x0020 || str.charCodeAt(i) > 0x007f) { return false }
  }
  return true
}

class Lattice extends Signer {
  constructor (deviceId, signers) { 
    super()
    this.signers = signers

    this.id = 'lattice-' + deviceId
    this.deviceId = deviceId
    this.type = 'lattice'
    this.status = 'loading'

    this.suffix = ''
    this.baseUrl = ''
    this.privKey = ''

    this.latticeObs = store.observer(() => {
      this.config = store('main.lattice', deviceId) || {}
      if (!this.config.privKey) {
        store.updateLattice(deviceId, { privKey: crypto.randomBytes(32).toString('hex') })
      } else {
        if (
          this.suffix !== this.config.suffix ||
          this.baseUrl !== this.config.baseUrl ||
          this.privKey !== this.config.privKey
        ) {
          this.client = this.createClient()
        }
      }
    })
  
    this.update()
    this.deviceStatus()
  }

  createClient () {
    const { suffix, baseUrl, privKey } = this.config
    const clientConfig = {
      name: suffix ? `Frame-${suffix}` : 'Frame',
      crypto: crypto,
      timeout: 30000,
      baseUrl,
      privKey
    }
    return new Client(clientConfig)
  }

  async setPair (pin) {
    try {
      const clientPair = promisify(this.client.pair).bind(this.client)
      const hasActiveWallet = await clientPair(pin)
      if (hasActiveWallet) await this.deriveAddresses()
      return this.addresses
    } catch (err) {
      log.error('Lattice setPair Error', err)
      return new Error(err)
    }
  }

  async open () {
    try {
      if (this.config.deviceId) {
        if (!this.client) throw new Error('Client not ready during open')
        this.status = 'connecting'
        this.update()
        const clientConnect = promisify(this.client.connect).bind(this.client)
        this.paired = await clientConnect(this.config.deviceId)
        if (this.paired) {
          this.status = 'addresses'
          this.update()
          await this.deriveAddresses()
        } else {
          this.status = 'pairing'
          this.update()
        }
      } else {
        return new Error('No deviceId')
      }
    } catch (err) {
      log.error('Lattice Open Error', err)
      return new Error(err)
    }
  }

  close () {
    if (this._pollStatus) clearTimeout(this._pollStatus)
    this.latticeObs.remove()
    this.closed = true
    store.removeSigner(this.id)
    store.removeLattice(this.deviceId)
    super.close()
  }

  async wait (time) {
    return new Promise(resolve => setTimeout(resolve, time))
  }

  async deriveAddresses () {
    // TODO: Move these settings to be device spectifc
    const accountLimit = store('main.latticeSettings.accountLimit')
    try {
      const req = {
        currency: 'ETH',
        startPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, 0],
        n: accountLimit,
        skipCache: true
      }
      if (!this.client) throw new Error('Client not ready during deriveAddresse')
      const getAddresses = promisify(this.client.getAddresses).bind(this.client)
      const result = await getAddresses(req)
      this.status = 'ok'
      this.addresses = result
      this.update()
      return result
    } catch (err) {
      this.status = 'locked'
      this.update()
      return []
    }
  }

  pollStatus (interval = 21 * 1000) { // Detect sleep/wake
    clearTimeout(this._pollStatus)
    this._pollStatus = setTimeout(() => this.deviceStatus(), interval)
  }

  async deviceStatus () {
    // this.pollStatus() // Unscheduled requets reult in errors
    if (this.deviceStatusActive || this.verifyActive) return
    this.deviceStatusActive = true
    try {
      // If signer has no addresses, try deriving them
      await this.open()
      this.deviceStatusActive = false
    } catch (err) {
      this.deviceStatusActive = false
    }
  }

  // This verifyAddress signature is no longer current
  async verifyAddress (index, current, display, cb = () => {}) {
    if (this.verifyActive) {
      log.info('verifyAddress Called but it\'s already active')
      return cb(new Error('verifyAddress Called but it\'s already active'))
    }
    if (this.pause) {
      log.info('Device access is paused')
      return cb(new Error('Device access is paused'))
    }
    this.verifyActive = true
    try {
      const result = await this.deriveAddresses()
      if (result && !result.length) {
        return cb(null, false)
      }
      const address = result[index].toLowerCase()
      current = current.toLowerCase()
      if (address !== current) {
        log.error(new Error('Address does not match device'))
        this.reset()
        this.signers.remove(this.id)
        cb(new Error('Address does not match device'))
      } else {
        log.info('Address matches device')
        cb(null, true)
      }
      this.verifyActive = false
    } catch (err) {
      log.error('Verify Address Error')
      log.error(err)
      this.signers.remove(this.id)
      cb(new Error('Verify Address Error'))
      this.verifyActive = false
    }
  }

  update () {
    store.updateSigner(this.summary())
  }

  async reset () {
    this.status = 'loading'
    this.addresses = []
    await this.deriveAddresses()
  }

  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }

  hexToBuffer (hex) {
    return Buffer.from(this.normalize(hex), 'hex')
  }

  // Standard Methods
  async signMessage (index, message, cb) {
    const asciiMessage = utils.hexToAscii(message)
    if (humanReadable(asciiMessage)) {
      message = asciiMessage
    }

    try {
      const data = {
        protocol: 'signPersonal',
        payload: message,
        signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index] // setup for other deviations
      }
      const signOpts = {
        currency: 'ETH_MSG',
        data: data
      }
      const clientSign = promisify(this.client.sign).bind(this.client)

      const result = await clientSign(signOpts)
      let v = result.sig.v.toString(16)
      if (v.length < 2) v = '0' + v
      const signature = '0x' + result.sig.r + result.sig.s + v

      return cb(null, signature)
    } catch (err) {
      return cb(new Error(err))
    }
  }

  async signTransaction (index, rawTx, cb) {
    try {
      if (parseInt(store('main.currentNetwork.id')) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
      const unsignedTxn = {
        nonce: utils.hexToNumber(rawTx.nonce),
        gasPrice: utils.hexToNumber(rawTx.gasPrice),
        gasLimit: utils.hexToNumber(rawTx.gas),
        to: rawTx.to,
        value: rawTx.value,
        data: rawTx.data || '0x',
        chainId: rawTx.chainId,
        useEIP155: true,
        signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index]
      }

      const signOpts = { currency: 'ETH', data: unsignedTxn }
      const clientSign = promisify(this.client.sign).bind(this.client)
      const result = await clientSign(signOpts)

      const tx = new EthereumTx({
        nonce: this.hexToBuffer(rawTx.nonce),
        gasPrice: this.hexToBuffer(rawTx.gasPrice),
        gasLimit: this.hexToBuffer(rawTx.gas),
        to: this.hexToBuffer(rawTx.to),
        value: this.hexToBuffer(rawTx.value),
        data: this.hexToBuffer(rawTx.data),
        v: result.sig.v[0],
        r: this.hexToBuffer(result.sig.r),
        s: this.hexToBuffer(result.sig.s)
      }, { chain: parseInt(rawTx.chainId) })
      return cb(null, '0x' + tx.serialize().toString('hex'))
    } catch (err) {
      return cb(new Error(err))
    }
  }
}

module.exports = Lattice
