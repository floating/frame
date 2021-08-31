const crypto = require('crypto')
const log = require('electron-log')
const utils = require('web3-utils')
const { padToEven, stripHexPrefix, addHexPrefix } = require('ethereumjs-util')
const { Client } = require('gridplus-sdk')
const { promisify } = require('util')
const { sign, signerCompatibility, londonToLegacy } = require('../../../transaction')

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

    this.latticeObs = store.observer(() => {
      this.createClient()

      if (this.accountLimit !== store('main.latticeSettings.accountLimit')) {
        this.accountLimit = store('main.latticeSettings.accountLimit')
        this.open()
      }
    })
  }

  createClient () {
    let endpointMode, baseUrl, suffix, privKey
    endpointMode = store('main.latticeSettings.endpointMode')
    if (endpointMode === 'custom') {
      baseUrl = store('main.latticeSettings.endpointCustom')
    } else {
      baseUrl = 'https://signing.gridpl.us'
    }
    suffix = store('main.latticeSettings.suffix')
    privKey = store('main.lattice', this.deviceId, 'privKey')

    if (
      this.endpointMode !== endpointMode ||
      this.suffix !== suffix ||
      this.baseUrl !== baseUrl ||
      this.privKey !== privKey
    ) {
      this.endpointMode = endpointMode
      this.suffix = suffix
      this.baseUrl = baseUrl
      this.privKey = privKey
      this.client = new Client({
        name: suffix ? `Frame-${suffix}` : 'Frame',
        crypto: crypto,
        timeout: 120000,
        baseUrl,
        privKey
      })

      this.status = 'disconnected'
      this.create()
    }
  }

  async setPair (pin) {
    try {
      this.status = 'pairing'
      this.update()
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
      if (this.deviceId) {
        if (!this.client) throw new Error('Client not ready during open')
        if (this.status !== 'pair') {
          this.status = 'connecting'
          this.update()
        }
        const clientConnect = promisify(this.client.connect).bind(this.client)
        this.paired = await clientConnect(this.deviceId)

        const [patch, minor, major] = this.client.fwVersion || [0, 0, 0]

        log.debug(`Connected to Lattice with deviceId=${this.deviceId}, firmware v${major}.${minor}.${patch}`)

        this.appVersion = { major, minor, patch }

        if (this.paired) {
          if (this.addresses.length === 0) {
            this.status = 'addresses'
            this.update()
          }
          await this.deriveAddresses()
        } else {
          this.status = 'pair'
          this.update()
        }
      } else {
        return new Error('No deviceId')
      }
    } catch (err) {
      if (typeof err !== 'string') err = err.message
      if (err === 'Error from device: Invalid Request') return log.warn('Lattice: Invalid Request')
      if (err === 'Error from device: Device Busy') return log.warn('Lattice: Device Busy')
      try {
        err = err.replace('Error from device: ', '')
      } catch (e) {
        log.error(e)
      }
      // Update this signer only if it was previously created
      this.status = err
      this.update()
      log.error('Lattice Open Error', err)
      return new Error(err)
    }
  }

  close () {
    if (this._pollStatus) clearTimeout(this._pollStatus)
    this.latticeObs.remove()
    this.closed = true
    store.removeSigner(this.id)
    super.close()
  }

  delete () {
    store.removeLattice(this.deviceId)
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
      if (err === 'Error from device: Invalid Request') return log.warn('Lattice: Invalid Request')
      if (err === 'Error from device: Device Busy') return log.warn('Lattice: Device Busy')
      this.status = 'loading'
      this.update()
      log.error(err)
      setTimeout(() => this.deriveAddresses(), 6000)
      return []
    }
  }

  // pollStatus (interval = 5 * 1000) { // Detect sleep/wake
  //   clearTimeout(this._pollStatus)
  //   this._pollStatus = setTimeout(() => this.deviceStatus(), interval)
  // }

  // async deviceStatus () {
  //   this.pollStatus()
  //   this.deviceStatusActive = true
  //   try {
  //     const clientConnect = promisify(this.client.connect).bind(this.client)
  //     await clientConnect()
  //     const wallet = this.client.getActiveWallet()
  //     if (!wallet) {
  //       console.log('No wallet')
  //     } else if (wallet.id !== (this.wallet && this.wallet.id)) {
  //       this.wallet = wallet
  //       console.log('Wallet is different')
  //     } else {
  //       console.log('Wallet is same')
  //     }
  //     this.deviceStatusActive = false
  //   } catch (err) {
  //     console.log(err)
  //     this.status = 'disconnected'
  //     this.update()
  //     this.deviceStatusActive = false
  //   }
  // }

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
      if (!result) {
        log.info('No result from derive addresses')
        return cb(new Error('No result from derive addresses'))
      }
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

  signerExists() {
    return (store('main.signers')[`lattice-${this.deviceId}`]) !== undefined
  }

  update () {
    // If this signer exists, update with current params
    if (this.signerExists())
      store.updateSigner(this.summary())
  }

  create () {
    // If this signer does NOT exist, create it
    if (!this.signerExists())
      store.updateSigner(this.summary())
  }

  async reset () {
    this.status = 'loading'
    this.addresses = []
    await this.deriveAddresses()
  }

  normalize (hex) {
    return (hex && padToEven(stripHexPrefix(hex))) || ''
  }

  hexToBuffer (hex) {
    return Buffer.from(this.normalize(hex), 'hex')
  }

  // Standard Methods
  async _signMessage (index, protocol, payload) {
    const clientSign = promisify(this.client.sign).bind(this.client)

    const data = {
      protocol: protocol,
      payload: payload,
      signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index] // setup for other derivations
    }

    const signOpts = {
      currency: 'ETH_MSG',
      data: data
    }

    const result = await clientSign(signOpts)

    const signature = [
      result.sig.r,
      result.sig.s,
      padToEven(result.sig.v.toString('hex'))
    ].join('')

    return addHexPrefix(signature)
  }

  async signMessage (index, message, cb) {
    try {
      const asciiMessage = utils.hexToAscii(message)
      if (humanReadable(asciiMessage)) {
        message = asciiMessage
      }

      const signature = await this._signMessage(index, 'signPersonal', message)

      return cb(null, signature)
    } catch (err) {
      return cb(new Error(err))
    }
  }

  async signTypedData (index, typedData, cb) {
    try {
      const signature = await this._signMessage(index, 'eip712', typedData)

      return cb(null, signature)
    } catch (err) {
      return cb(new Error(err))
    }
  }

  _createTransaction (index, txType, chainId, tx) {
    const { value, to, data, ...txJson } = tx.toJSON()
    const type = utils.hexToNumber(txType)

    const unsignedTx = {
      to,
      value,
      data,
      chainId,
      nonce: utils.hexToNumber(txJson.nonce),
      gasLimit: utils.hexToNumber(txJson.gasLimit),
      useEIP155: true,
      signerPath: [HARDENED_OFFSET + 44, HARDENED_OFFSET + 60, HARDENED_OFFSET, 0, index]
    }

    if (type) {
      unsignedTx.type = type
    }

    const optionalFields = ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']

    optionalFields.forEach(field => {
      if (txJson[field]) {
        unsignedTx[field] = utils.hexToNumber(txJson[field])
      }
    })

    return unsignedTx
  }

  async signTransaction (index, rawTx, cb) {
    const compatibility = signerCompatibility(rawTx, this.summary())
    const latticeTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

    sign(latticeTx, tx => {
      const unsignedTx = this._createTransaction(index, rawTx.type, latticeTx.chainId, tx)
      const signOpts = { currency: 'ETH', data: unsignedTx }
      const clientSign = promisify(this.client.sign).bind(this.client)

      return clientSign(signOpts).then(result => ({
        v: result.sig.v[0],
        r: result.sig.r,
        s: result.sig.s
      }))
    })
    .then(signedTx => cb(null, addHexPrefix(signedTx.serialize().toString('hex'))))
    .catch(err => {
      log.error('error signing transaction with Lattice', err)
      cb(new Error(`Failed to sign transaction: ${err}`))
    })
  }
}

module.exports = Lattice
