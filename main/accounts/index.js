const EventEmitter = require('events')
const hdKey = require('ethereumjs-wallet/hdkey')
const log = require('electron-log')
// const bip39 = require('bip39')

const crypt = require('../crypt')
const store = require('../store')
const signers = require('../signers')

// Provider Proxy
const proxyProvider = require('../provider/proxy')

const Account = require('./Account')

// newAccount = {
//   id: '',
//   type: '',
//   name: '',
//   addresses: [],
//   aliases: [],
//   requests: {},
//   permissions: {},
//   signer: false,
//   agent: {
//     id: account.agent.id, // Account Id
//     address: account.agent.address, // Address Index
//     account: false
//   }
// }

// const HDKey = require('hdkey')
// const { publicToAddress, toChecksumAddress } = require('ethereumjs-util')
//
const windows = require('../windows')

// module.exports = Signer

// Accounts
//
//   Events
//    'added' - Emits account object when added
//    'updated' - Emits account object when updated
//    'removed - Emits account ID when account is removed
//
//   Methods
//    'list' - Returns list of accounts
//    'add' - Adds account by list of addresses
//    'remove' - Removes an account by ID
//
// Accounts look for matching signers
//
// Red - Signer Not Found
// Orange - Signer Locked, Signer Asleep, etc
// Green - Signer Ready
//
// Note: removing accounts removes matching underlying signer if it exists

// Create hot Account

// Monitor Signers
//   Get all accounts...
//   Get all signers...
//   Render all accounts, look up matching signer status
//   Look for signers that aren't accounts yet, create accounts for each
//   On new signer, automatically make account

class Accounts extends EventEmitter {
  constructor () {
    super()
    this._current = ''
    this.accounts = {}
    let stored = store('main.accounts')
    Object.keys(stored).forEach(id => { this.accounts[id] = new Account(stored[id], this) })
    signers.list().forEach(this.sigerUpdate.bind(this))
    signers.on('update', this.sigerUpdate.bind(this))
  }
  sigerUpdate (signer) {
    log.info('[Accounts] Signer update')
    if (!this.accounts[signer.id]) {
      log.info('[Accounts] No account matched this new signer, creating account')
      this.add(signer.addresses)
    } else {
      log.info('[Accounts] An existing account matched the updated signer')
    }
  }
  list () {
    return Object.keys(this.accounts).map(id => this.accounts[id].summary())
  }
  get (id) {
    return this.accounts[id].summary()
  }
  select (id) {
    // Set current account
  }
  closeAll () {
    // Close all accounts
  }
  seedToAddresses (seed) {
    const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0')
    const addresses = []
    for (var i = 0; i < 100; i++) { addresses.push(wallet.deriveChild(i).getWallet().getChecksumAddressString()) }
    return addresses
  }
  addressesToId (addresses) {
    return crypt.stringToKey(addresses.join()).toString('hex')
  }
  // Public
  add (addresses, cb = () => {}) {
    const accounts = store('main.accounts')
    const id = this.addressesToId(addresses)
    if (accounts[id]) {
      log.info('Account already exists')
      cb(null, accounts[id])
    } else {
      log.info('Account not found, creating account')
      const account = { id, addresses, index: 0, created: Date.now() }
      this.accounts[id] = new Account(account, this)
    }
  }
  update (account) {
    log.info('Account update called')
    store.updateAccount(account)
    this.emit('update', account)
  }
  current () {
    return this.accounts[this._current]
  }
  txMonitor (id, hash) {
    this.current().requests[id].tx = { hash, confirmations: 0 }
    this.current().update()
    proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads'] }, newHeadRes => {
      if (newHeadRes.error) {
        // TODO: Handle Error
      } else if (newHeadRes.result) {
        const headSub = newHeadRes.result
        const handler = payload => {
          if (payload.method === 'eth_subscription' && payload.params.subscription === headSub) {
            const newHead = payload.params.result
            proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [hash] }, receiptRes => {
              if (receiptRes.error) {
                // TODO: Handle Error
              } else if (receiptRes.result && this.current().requests[id]) {
                this.current().requests[id].tx.receipt = receiptRes.result
                if (receiptRes.result.status === '0x1' && this.current().requests[id].status === 'verifying') {
                  this.current().requests[id].status = 'confirming'
                  this.current().requests[id].notice = 'Confirming'
                }
                let blockHeight = parseInt(newHead.number, 16)
                let receiptBlock = parseInt(this.current().requests[id].tx.receipt.blockNumber, 16)
                let confirmations = blockHeight - receiptBlock
                this.current().requests[id].tx.confirmations = confirmations
                this.current().update()
                if (confirmations > 12) {
                  this.current().requests[id].status = 'confirmed'
                  this.current().requests[id].notice = 'Confirmed'
                  this.current().update()
                  proxyProvider.removeListener('data', handler)
                  proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_unsubscribe', params: [headSub] }, unsubRes => {
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
  getSigners (cb) {
    let signerSummary = {}
    Object.keys(this.accounts).forEach(id => {
      let summary = this.accounts[id].summary()
      if (summary.status === 'Invalid sequence' || summary.status === 'initial') return
      signerSummary[id] = summary
    })
    cb(null, signerSummary)
  }
  setSigner (id, cb) {
    this.accounts[id].setIndex(this.accounts[id].index, err => {
      if (err) return cb(err)
      this._current = id
      let summary = this.current().summary()
      cb(null, summary)
      windows.broadcast('main:action', 'setSigner', summary)
    })
  }
  unsetSigner (cb) {
    let s = this.current()
    this._current = null
    let summary = { id: '', type: '', accounts: [], status: '', index: 0 }
    if (cb) cb(null, summary)
    windows.broadcast('main:action', 'unsetSigner', summary)
    setTimeout(() => { // Clear signer requests when unset
      if (s) {
        s.requests = {}
        s.update()
      }
    })
  }
  verifyAddress (display) {
    if (this.current() && this.current().verifyAddress) this.current().verifyAddress(display)
  }
  getSelectedAddresses () {
    return this.current() ? this.current().getSelectedAddresses() : []
  }
  getSelectedAddress () {
    return this.current() ? this.current().getSelectedAddress() : undefined
  }
  getAccounts (cb) {
    if (!this.current()) {
      if (cb) cb(new Error('No Account Selected'))
      return
    }
    return this.current().getAccounts(cb)
  }
  getCoinbase (cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    this.current().getCoinbase(cb)
  }
  signMessage (address, message, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== this.getSelectedAccounts()[0].toLowerCase()) return cb(new Error('signMessage: Wrong Account Selected'))
    this.current().signMessage(message, cb)
  }
  signTransaction (rawTx, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    this.current().signTransaction(rawTx, cb)
  }
  close () {
    // usbDetect.stopMonitoring()
  }
  setSignerIndex (index, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    this.current().setIndex(index, cb)
  }
  trezorPin (id, pin, cb) {
    if (!this.accounts[id]) return cb(new Error('No Account Selected'))
    if (this.accounts[id].setPin) {
      this.accounts[id].setPin(pin)
      cb(null, { status: 'ok' })
    } else {
      cb(new Error('Set pin not avaliable...'))
    }
  }
  addRequest (req) {
    log.info('addRequest', req)
    if (!this.current() || this.current().requests[req.handlerId]) return // If no current signer or the request already exists
    this.current().requests[req.handlerId] = req
    this.current().requests[req.handlerId].mode = 'normal'
    this.current().requests[req.handlerId].created = Date.now()
    this.current().update()
    windows.showTray()
    windows.broadcast('main:action', 'setSignerView', 'default')
  }
  removeRequest (handlerId) {
    if (this.current() && this.current().requests[handlerId]) {
      delete this.current().requests[handlerId]
      this.current().update()
    }
  }
  declineRequest (handlerId) {
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId]) {
      this.current().requests[handlerId].status = 'declined'
      this.current().requests[handlerId].notice = 'Signature Declined'
      if (this.current().requests[handlerId].type === 'transaction') {
        this.current().requests[handlerId].mode = 'monitor'
      } else {
        setTimeout(() => this.removeRequest(handlerId), 3300)
      }
      this.current().update()
    }
  }
  setRequestPending (req) {
    let handlerId = req.handlerId
    log.info('setRequestPending', handlerId)
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId]) {
      this.current().requests[handlerId].status = 'pending'
      this.current().requests[handlerId].notice = 'See Signer'
      this.current().update()
    }
  }
  setRequestError (handlerId, err) {
    log.info('setRequestError', handlerId)
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId]) {
      this.current().requests[handlerId].status = 'error'
      if (err.message === 'Ledger device: Invalid data received (0x6a80)') {
        this.current().requests[handlerId].notice = 'Ledger Contract Data = No'
      } else if (err.message === 'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)') {
        this.current().requests[handlerId].notice = 'Ledger Signature Declined'
      } else {
        let notice = err && typeof err === 'string' ? err : err && typeof err === 'object' && err.message && typeof err.message === 'string' ? err.message : 'Unknown Error' // TODO: Update to normalize input type
        this.current().requests[handlerId].notice = notice
      }
      if (this.current().requests[handlerId].type === 'transaction') {
        setTimeout(() => {
          if (this.current() && this.current().requests[handlerId]) {
            this.current().requests[handlerId].mode = 'monitor'
            this.current().update()
          }
        }, 1500)
      } else {
        setTimeout(() => this.removeRequest(handlerId), 3300)
      }
      this.current().update()
    }
  }
  setTxSigned (handlerId, cb) {
    log.info('setTxSigned', handlerId)
    if (!this.current()) return cb(new Error('No account selected'))
    if (this.current().requests[handlerId]) {
      if (this.current().requests[handlerId].status === 'declined') {
        cb(new Error('Request already declined'))
      } else {
        this.current().requests[handlerId].status = 'sending'
        this.current().requests[handlerId].notice = 'Sending'
        this.current().update()
        cb()
      }
    } else {
      cb(new Error('No valid request for ' + handlerId))
    }
  }
  setTxSent (handlerId, hash) {
    log.info('setTxSent', handlerId, 'Hash', hash)
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId]) {
      this.current().requests[handlerId].status = 'verifying'
      this.current().requests[handlerId].notice = 'Verifying'
      this.current().requests[handlerId].mode = 'monitor'
      this.current().update()
      this.txMonitor(handlerId, hash)
    }
  }
  setRequestSuccess (handlerId) {
    log.info('setRequestSuccess', handlerId)
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId]) {
      this.current().requests[handlerId].status = 'success'
      this.current().requests[handlerId].notice = 'Succesful'
      if (this.current().requests[handlerId].type === 'transaction') {
        this.current().requests[handlerId].mode = 'monitor'
      } else {
        setTimeout(() => this.removeRequest(handlerId), 3300)
      }
      this.current().update()
    }
  }
}

module.exports = new Accounts()
