const usbDetect = require('usb-detection')

// App Window API
const windows = require('../windows')

// Signer Modules
// const trezor = require('./trezor')
const ledger = require('./ledger')
const hot = require('./hot')

// Connected Signers
const signers = {}

// Add Signers
// trezor(signers)
ledger(signers)
hot(signers)

let current = null

module.exports = {
  getSigners: (cb) => {
    let signerSummary = {}
    Object.keys(signers).forEach(id => { signerSummary[id] = signers[id].summary() })
    cb(null, signerSummary)
    // cb(null, Object.keys(signers).sort().map(path => signers[path].summary()))
  },
  setSigner: (id, cb) => {
    current = id
    let summary = signers[current].summary()
    cb(null, summary)
    windows.broadcast('main:setSigner', summary)
  },
  unsetSigner: (cb) => {
    current = null
    let summary = {id: '', type: '', accounts: [], status: ''}
    cb(null, summary)
    windows.broadcast('main:setSigner', summary)
  },
  getAccounts: (cb) => {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    signers[current].getAccounts(cb)
  },
  getCoinbase: (cb) => {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    signers[current].getCoinbase(cb)
  },
  signPersonal: (message, address, cb) => {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== signers[current].accounts[0].toLowerCase()) return cb(new Error('signPersonal: Wrong Account Selected'))
    signers[current].signPersonal(message, cb)
  },
  signTransaction: (rawTx, cb) => {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    signers[current].signTransaction(rawTx, cb)
  },
  close: () => {
    usbDetect.stopMonitoring()
  },
  trezorPin: (id, pin, cb) => {
    if (!signers[id]) return cb(new Error('No Account Selected'))
    if (signers[id].setPin) {
      signers[id].setPin(null, pin)
      cb(null, {status: 'ok'})
    } else {
      cb(new Error('Set pin not avaliable...'))
    }
  }
}
