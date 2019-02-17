const usbDetect = require('usb-detection')
const log = require('electron-log')

// App Window API
const windows = require('../windows')

// Provider Proxy
const proxyProvider = require('../provider/proxy')

// Signer Modules
const trezor = require('./trezor')
const ledger = require('./ledger')
const hot = require('./hot')

const dev = process.env.NODE_ENV === 'development'

let current = null

// Connected Signers
const signers = {}

const txMonitor = (id, hash) => {
  signers[current].requests[id].tx = { hash, confirmations: 0 }
  signers[current].requests[id].status = 'monitor'
  signers[current].requests[id].notice = 'Confirming Transaction'
  signers[current].requests[id].mode = 'monitor'
  signers[current].update()
  proxyProvider.emit('send', {id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads']}, newHeadRes => {
    if (newHeadRes.error) {
      // TODO: Handle Error
    } else if (newHeadRes.result) {
      const headSub = newHeadRes.result
      const handler = payload => {
        if (payload.method === 'eth_subscription' && payload.params.subscription === headSub) {
          const newHead = payload.params.result
          proxyProvider.emit('send', {id: 1, jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [hash]}, receiptRes => {
            if (receiptRes.error) {
              // TODO: Handle Error
            } else if (receiptRes.result && signers[current].requests[id]) {
              signers[current].requests[id].tx.receipt = receiptRes.result
              let blockHeight = parseInt(newHead.number, 16)
              let receiptBlock = parseInt(signers[current].requests[id].tx.receipt.blockNumber, 16)
              let confirmations = blockHeight - receiptBlock
              signers[current].requests[id].tx.confirmations = confirmations
              signers[current].update()
              if (confirmations >= 6) {
                proxyProvider.removeListener('data', handler)
                proxyProvider.emit('send', {id: 1, jsonrpc: '2.0', method: 'eth_unsubscribe', params: [headSub]}, unsubRes => {
                  // TODO: Handle Error
                })
              }
            }

          })
        }
      }
      proxyProvider.on('data', handler)
    }
  })
}

const api = {
  getSigners (cb){
    let signerSummary = {}
    Object.keys(signers).forEach(id => {
      let summary = signers[id].summary()
      if (summary.status === 'Invalid sequence' || summary.status === 'initial') return
      signerSummary[id] = summary
    })
    cb(null, signerSummary)
  },
  setSigner (id, cb) {
    signers[id].setIndex(signers[id].index, err => {
      if (err) return cb(err)
      current = id
      let summary = signers[current].summary()
      cb(null, summary)
      windows.broadcast('main:action', 'setSigner', summary)
    })
  },
  unsetSigner (cb) {
    let s = signers[current]
    current = null
    let summary = { id: '', type: '', accounts: [], status: '', index: 0 }
    if (cb) cb(null, summary)
    windows.broadcast('main:action', 'unsetSigner', summary)
    setTimeout(() => { // Clear signer requests when unset
      if (s) {
        s.requests = {}
        s.update()
      }
    })
  },
  verifyAddress (display) {
    if (signers[current] && signers[current].verifyAddress) signers[current].verifyAddress(display)
  },
  getSelectedAccounts () {
    return signers[current] ? signers[current].getSelectedAccounts() : []
  },
  getSelectedAccount () {
    return signers[current] ? signers[current].getSelectedAccount() : undefined
  },
  getAccounts (cb) {
    if (!signers[current]) {
      if (cb) cb(new Error('No Account Selected'))
      return
    }
    return signers[current].getAccounts(cb)
  },
  getCoinbase (cb) {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    signers[current].getCoinbase(cb)
  },
  signPersonal (message, address, cb) {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== api.getSelectedAccounts()[0].toLowerCase()) return cb(new Error('signPersonal: Wrong Account Selected'))
    signers[current].signPersonal(message, cb)
  },
  signTransaction (rawTx, cb) {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    signers[current].signTransaction(rawTx, cb)
  },
  close () {
    usbDetect.stopMonitoring()
  },
  setSignerIndex (index, cb) {
    if (!signers[current]) return cb(new Error('No Account Selected'))
    signers[current].setIndex(index, cb)
  },
  trezorPin (id, pin, cb) {
    if (!signers[id]) return cb(new Error('No Account Selected'))
    if (signers[id].setPin) {
      signers[id].setPin(null, pin)
      cb(null, { status: 'ok' })
    } else {
      cb(new Error('Set pin not avaliable...'))
    }
  },
  addRequest (req) {
    log.info('addRequest', req.handlerId)
    if (!signers[current] || signers[current].requests[req.handlerId]) return // If no current signer or the request already exists
    signers[current].requests[req.handlerId] = req
    signers[current].requests[req.handlerId].mode = 'normal'
    signers[current].requests[req.handlerId].created = Date.now()
    signers[current].update({ setView: 'default' })
    windows.showTray()
    windows.broadcast('main:action', 'setSignerView', 'default')
  },
  removeRequest (handlerId) {
    if (signers[current] && signers[current].requests[handlerId]) {
      delete signers[current].requests[handlerId]
      signers[current].update()
    }
  },
  declineRequest (handlerId) {
    if (!signers[current]) return // cb(new Error('No Account Selected'))
    if (signers[current].requests[handlerId]) {
      signers[current].requests[handlerId].status = 'declined'
      signers[current].requests[handlerId].notice = 'Signature Declined'
      signers[current].update()
    }
    setTimeout(() => api.removeRequest(handlerId), 1800)
  },
  setRequestPending (req) {
    let handlerId = req.handlerId
    log.info('setRequestPending', handlerId)
    if (!signers[current]) return // cb(new Error('No Account Selected'))
    if (signers[current].requests[handlerId]) {
      signers[current].requests[handlerId].status = 'pending'
      signers[current].requests[handlerId].notice = 'Signature Pending'
      signers[current].update()
    }
  },
  setRequestError (handlerId, err) {
    log.info('setRequestError', handlerId)
    if (!signers[current]) return // cb(new Error('No Account Selected'))
    if (signers[current].requests[handlerId]) {
      signers[current].requests[handlerId].status = 'error'
      if (err.message === 'Ledger device: Invalid data received (0x6a80)') {
        signers[current].requests[handlerId].notice = 'Ledger Contract Data = No'
      } else if (err.message === 'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)') {
        signers[current].requests[handlerId].notice = 'Ledger Signature Declined'
      } else {
        let notice = err && typeof err === 'string' ? err : err && typeof err === 'object' && err.message && typeof err.message === 'string' ? err.message : 'Unknown Error' // TODO: Update to normalize input type
        signers[current].requests[handlerId].notice = notice
      }
      signers[current].update()
      setTimeout(() => api.removeRequest(handlerId), 3300)
    }
  },
  setTxHash (handlerId, hash) {
    log.info('setTxHash', handlerId)
    if (!signers[current]) return // cb(new Error('No Account Selected'))
    if (signers[current].requests[handlerId]) txMonitor(handlerId, hash)
  },
  setRequestSuccess (handlerId) {
    log.info('setRequestSuccess', handlerId)
    if (!signers[current]) return // cb(new Error('No Account Selected'))
    if (signers[current].requests[handlerId]) {
      signers[current].requests[handlerId].status = 'success'
      signers[current].requests[handlerId].notice = 'Signature Succesful'
      signers[current].update()
    }
  }
}

// Add Signers
trezor(signers, api)
ledger(signers, api)
if (dev || process.env.WITH_HOT === 'true') hot(signers, api)

module.exports = api
