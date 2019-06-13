const utils = require('web3-utils')
const EthereumTx = require('ethereumjs-tx')
const log = require('electron-log')
const Eth = require('@ledgerhq/hw-app-eth').default
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default
const store = require('../../../store')
// const windows = require('../../../windows')
const Signer = require('../../Signer')
const uuid = require('uuid/v5')
const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

let verifyActive

class Ledger extends Signer {
  constructor (devicePath, signers) {
    super()
    this.devicePath = devicePath
    this.addresses = []
    this.id = this.getId()
    this.signers = signers
    this.type = 'Ledger'
    this.status = 'initial'
    this.busyCount = 0
    this.pause = false
    this.coinbase = '0x'
    this.network = store('main.connection.network')
    this.basePath = () => this.network === '1' ? `44'/60'/0'/` : `44'/1'/0'/`
    this.getPath = (i = 0) => this.basePath() + i
    this.handlers = {}
    this.deviceStatus()
    this.networkObserver = store.observer(() => {
      if (this.network !== store('main.connection.network')) {
        this.reset()
        this.deviceStatus()
      }
    })
  }
  getId () {
    return this.addressesId() || uuid('Ledger' + this.devicePath, ns)
  }
  update () {
    if (this.invalid || this.status === 'Invalid sequence' || this.status === 'initial') return
    let id = this.getId()
    if (this.id !== id) { // Singer address representation changed
      store.removeSigner(this.id)
      this.id = id
    }
    store.updateSigner(this.summary())
  }
  reset () {
    this.network = store('main.connection.network')
    this.status = 'loading'
    this.addresses = []
    this.update()
  }
  async getDeviceAddress (i, cb) {
    if (this.pause) return cb(new Error('Ledger: Device access is paused'))
    this.pause = true
    try {
      let transport = await TransportNodeHid.open(this.devicePath)
      let eth = new Eth(transport)
      eth.getAddress(this.getPath(i), false, true).then(result => {
        transport.close()
        this.pause = false
        cb(null, result.address)
      }).catch(err => {
        transport.close()
        this.pause = false
        cb(err)
      })
    } catch (err) {
      this.pause = false
      cb(err)
    }
  }
  async verifyAddress (display, index = 0) {
    if (verifyActive) return log.info('verifyAddress Called but it\'s already active')
    if (this.pause) return log.info('Ledger: Device access is paused')
    verifyActive = true
    this.pause = true
    try {
      let transport = await TransportNodeHid.open(this.devicePath)
      let eth = new Eth(transport)
      eth.getAddress(this.getPath(index), display, true).then(result => {
        transport.close()
        this.pause = false
        let address = result.address.toLowerCase()
        let current = this.addresses[index].toLowerCase()
        if (address !== current) {
          // TODO: Error Notification
          log.error(new Error('Address does not match device'))
          this.signers.unsetSigner()
        } else {
          log.info('Address matches device')
        }
        verifyActive = false
      }).catch(err => {
        // TODO: Error Notification
        log.error('Verify Address Error')
        log.error(err)
        transport.close()
        this.pause = false
        this.signers.unsetSigner()
        verifyActive = false
      })
    } catch (err) {
      // TODO: Error Notification
      log.error('Verify Address Error')
      log.error(err)
      this.signers.unsetSigner()
      verifyActive = false
      this.pause = false
    }
  }
  // setIndex (i, cb) {
  //   if (!verifyActive) {
  //     this.index = i
  //     this.requests = {} // TODO Decline these requests before clobbering them
  //   }
  //   this.update()
  //   // windows.broadcast('main:action', 'updateSigner', this.summary())
  //   cb(null, this.summary())
  //   setTimeout(() => {
  //     this.verifyAddress()
  //   }, 300)
  // }
  async lookupAddresses (cb) {
    if (this.pause) cb(new Error('Ledger: Device access is paused'))
    this.pause = true
    try {
      let transport = await TransportNodeHid.open(this.devicePath)
      transport.setDebugMode(true)
      console.log('HERERE', this.id, this.devicePath.substr(this.devicePath.length - 5))
      let eth = new Eth(transport)
      console.log('HERERE 33', this.id, this.devicePath.substr(this.devicePath.length - 5))

      let timeout = setTimeout(() => {
        console.log('timeouttt')
        transport.close()
        this.lookupAddresses(cb)
      }, 5000)
      eth.getAddress(this.basePath(), false, true).then(result => {
        clearTimeout(timeout)
        console.log('HERERE RES', this.id, this.devicePath.substr(this.devicePath.length - 5))
        transport.close()
        this.pause = false
        this.deriveHDAccounts(result.publicKey, result.chainCode, cb)
      }).catch(err => {
        clearTimeout(timeout)
        console.log('HERERE ERRR', this.id, this.devicePath.substr(this.devicePath.length - 5))
        transport.close()
        this.pause = false
        cb(err)
      })
    } catch (err) {
      console.log('HERERE outer err', this.id, this.devicePath.substr(this.devicePath.length - 5))
      this.pause = false
      cb(err)
    }
  }
  close () {
    if (this._pollStatus) clearTimeout(this._pollStatus)
    if (this._deviceStatus) clearTimeout(this._deviceStatus)
    if (this._signMessage) clearTimeout(this._signMessage)
    if (this._signTransaction) clearTimeout(this._signTransaction)
    this.networkObserver.remove()
    store.removeSigner(this.id)
    super.close()
  }
  pollStatus (interval = 21 * 1000) { // Detect sleep/wake
    clearTimeout(this._pollStatus)
    this._pollStatus = setTimeout(() => this.deviceStatus(), interval)
  }
  deviceStatus (deep, limit = 100) {
    console.log('deviceStatus || status, paused', this.status, this.pause)
    if (this.status === 'Invalid sequence') return console.log('INVALID SEQUENCE')
    this.pollStatus()
    if (this.pause) return
    this.lookupAddresses((err, addresses) => {
      // let last = this.status
      if (err) {
        if (err.message.startsWith('cannot open device with path')) { // Device is busy, try again
          clearTimeout(this._deviceStatus)
          if (++this.busyCount > 10) {
            this.busyCount = 0
            return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
          } else {
            this._deviceStatus = setTimeout(() => this.deviceStatus(), 700)
            log.info('>>>>>>> Busy: cannot open device with path, will try again (deviceStatus)')
          }
        } else {
          this.status = err.message
          if (err.statusCode === 27904) this.status = 'Wrong application, select the Ethereum application on your Ledger'
          if (err.statusCode === 26368) this.status = 'Select the Ethereum application on your Ledger'
          if (err.statusCode === 26625 || err.statusCode === 26628) {
            this.pollStatus(3000)
            this.status = 'Confirm your Ledger is not asleep and is running firmware v1.4.0+'
          }
          if (err.message === 'Cannot write to HID device') {
            this.status = 'loading'
            log.error('Device Status: Cannot write to HID device')
          }
          if (err.message === 'Invalid channel') {
            this.status = 'Set browser support to "NO"'
            log.error('Device Status: Invalid channel -> Make sure browser support is set to OFF')
          }
          if (err.message === 'Invalid sequence') this.invalid = true
          this.addresses = []
          this.update()
          // if (this.status !== last) {
          //   this.update()
          // }
        }
      } else if (addresses && addresses.length) {
        // this.id = this.signers.addressesToId(addresses)
        this.busyCount = 0
        if (addresses[0] !== this.coinbase || this.status !== 'ok') {
          this.coinbase = addresses[0]
          this.addresses = addresses
          this.deviceStatus(true)
        }
        if (addresses.length > this.addresses.length) this.addresses = addresses
        this.status = 'ok'
        this.update()
      } else {
        this.busyCount = 0
        this.status = 'Unable to find accounts'
        this.addresses = []
        this.update()
      }
    })
  }
  normalize (hex) {
    if (hex == null) return ''
    if (hex.startsWith('0x')) hex = hex.substring(2)
    if (hex.length % 2 !== 0) hex = '0' + hex
    return hex
  }
  // Standard Methods
  async signMessage (message, index, cb) {
    if (this.pause) return cb(new Error('Ledger: Device access is paused'))
    this.pause = true
    try {
      let transport = await TransportNodeHid.open(this.devicePath)
      let eth = new Eth(transport)
      eth.signPersonalMessage(this.getPath(index), message.replace('0x', '')).then(result => {
        let v = (result['v'] - 27).toString(16)
        if (v.length < 2) v = '0' + v
        cb(null, '0x' + result['r'] + result['s'] + v)
        transport.close()
        this.busyCount = 0
        this.pause = false
      }).catch(err => {
        cb(err)
        transport.close()
        this.pause = false
      })
    } catch (err) {
      this.pause = false
      if (err.message.startsWith('cannot open device with path')) {
        clearTimeout(this._signMessage)
        if (++this.busyCount > 10) {
          this.busyCount = 0
          return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._signMessage = setTimeout(() => this.signMessage(message, cb), 700)
          return log.info('>>>>>>> Busy: cannot open device with path, will try again (signMessage)')
        }
      }
      cb(err)
      log.error(err)
    }
  }
  async signTransaction (rawTx, index, cb) {
    if (this.pause) return cb(new Error('Ledger: Device access is paused'))
    this.pause = true
    try {
      let transport = await TransportNodeHid.open(this.devicePath)
      let eth = new Eth(transport)
      if (parseInt(this.network) !== utils.hexToNumber(rawTx.chainId)) return cb(new Error('Signer signTx network mismatch'))
      const tx = new EthereumTx(rawTx)
      tx.raw[6] = Buffer.from([rawTx.chainId]) // v
      tx.raw[7] = Buffer.from([]) // r
      tx.raw[8] = Buffer.from([]) // s
      const rawTxHex = tx.serialize().toString('hex')
      eth.signTransaction(this.getPath(index), rawTxHex).then(result => {
        transport.close()
        this.busyCount = 0
        this.pause = false
        let tx = new EthereumTx({
          nonce: Buffer.from(this.normalize(rawTx.nonce), 'hex'),
          gasPrice: Buffer.from(this.normalize(rawTx.gasPrice), 'hex'),
          gasLimit: Buffer.from(this.normalize(rawTx.gas), 'hex'),
          to: Buffer.from(this.normalize(rawTx.to), 'hex'),
          value: Buffer.from(this.normalize(rawTx.value), 'hex'),
          data: Buffer.from(this.normalize(rawTx.data), 'hex'),
          v: Buffer.from(this.normalize(result.v), 'hex'),
          r: Buffer.from(this.normalize(result.r), 'hex'),
          s: Buffer.from(this.normalize(result.s), 'hex')
        })
        cb(null, '0x' + tx.serialize().toString('hex'))
      }).catch(err => {
        transport.close()
        this.pause = false
        cb(err.message)
      })
    } catch (err) {
      this.pause = false
      if (err.message.startsWith('cannot open device with path')) {
        clearTimeout(this._signTransaction)
        if (++this.busyCount > 10) {
          this.busyCount = 0
          return log.info('>>>>>>> Busy: Limit (10) hit, cannot open device with path, will not try again')
        } else {
          this._signTransaction = setTimeout(() => this.signTransaction(rawTx, cb), 700)
          return log.info('>>>>>>> Busy: cannot open device with path, will try again (signTransaction)')
        }
      }
      cb(err)
      log.error(err)
    }
  }
}

module.exports = Ledger
