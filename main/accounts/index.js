const EventEmitter = require('events')
const hdKey = require('ethereumjs-wallet/hdkey')
const log = require('electron-log')
// const bip39 = require('bip39')

const crypt = require('../crypt')
const store = require('../store')

// Provider Proxy
const proxyProvider = require('../provider/proxy')

const Account = require('./Account')
const windows = require('../windows')

// let aragonTestAccount = {
//   id: 'test',
//   index: 0,
//   addresses: ['0x4F4E43C7a6310a0cD716bbba563B901FAc07D085'], // Agent Address
//   type: 'Aragon',
//   smart: {
//     type: 'aragon',
//     actor: { // Reference to Frame account that will act on behalf of the agent
//       id: '3932643439326431633163373864326336383761633466366662366261363337',
//       index: 0,
//       address: '0xf4Ed810dEF41F31141B652e49fe847e6D7455BfD' // External Signer
//     },
//     dao: '0xd237ea861d39bf43aeed507c53f3826f5eabcafd', // DAO Address
//     agent: '0x4F4E43C7a6310a0cD716bbba563B901FAc07D085', // Agent Address
//     vault: '0x98e8e0381abe2c4b8a07000e8a913566fa641005' // Vault Address
//   }
// }
// let aragonTestAccount1 = {
//   id: 'test1',
//   index: 0,
//   addresses: ['0x4f4e43c7a6310a0cd716bbba563b901fac07d085'], // Agent Address
//   type: 'Aragon',
//   smart: {
//     type: 'aragon',
//     actor: { // Reference to Frame account that will act on behalf of the agent
//       id: '3932643439326431633163373864326336383761633466366662366261363337',
//       index: 0,
//       address: '0xf4Ed810dEF41F31141B652e49fe847e6D7455BfD' // External Signer
//     },
//     dao: '0xd237ea861d39bf43aeed507c53f3826f5eabcafd', // DAO Address
//     agent: '0x4f4e43c7a6310a0cd716bbba563b901fac07d085', // Agent Address
//     vault: '0x98e8e0381abe2c4b8a07000e8a913566fa641005' // Vault Address
//   }
// }
//
// let aragonTestAccount2 = {
//   id: 'test2',
//   index: 0,
//   addresses: ['0x4f4e43c7a6310a0cd716bbba563b901fac07d085'], // Agent Address
//   type: 'Aragon',
//   smart: {
//     type: 'aragon',
//     actor: { // Reference to Frame account that will act on behalf of the agent
//       id: '3932643439326431633163373864326336383761633466366662366261363337',
//       index: 0,
//       address: '0xf4Ed810dEF41F31141B652e49fe847e6D7455BfD' // External Signer
//     },
//     dao: '0xd237ea861d39bf43aeed507c53f3826f5eabcafd', // DAO Address
//     agent: '0x4f4e43c7a6310a0cd716bbba563b901fac07d085', // Agent Address
//     vault: '0x98e8e0381abe2c4b8a07000e8a913566fa641005' // Vault Address
//   }
// }

class Accounts extends EventEmitter {
  constructor () {
    super()
    this._current = ''
    this.accounts = {}
    let stored = store('main.accounts')
    Object.keys(stored).forEach(id => {
      this.accounts[id] = new Account(stored[id], this)
    })
    // Aragon Testing
    // this.accounts[aragonTestAccount.id] = new Account(aragonTestAccount, this)
    // this.accounts[aragonTestAccount1.id] = new Account(aragonTestAccount1, this)
    // this.accounts[aragonTestAccount2.id] = new Account(aragonTestAccount2, this)
    store.observer(() => {
      let signers = store('main.signers')
      Object.keys(signers).forEach(id => {
        if (!this.accounts[id]) this.add(signers[id].addresses)
      })
    })
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
  addAragon (account) {
    this.accounts[account.id] = new Account(account, this)
  }
  add (addresses, cb = () => {}) {
    if (addresses.length === 0) return cb(new Error('No addresses, will not add account'))
    const id = this.addressesToId(addresses)
    const account = store('main.accounts', id)
    if (account) return cb(null, account) // Account already exists...
    log.info('Account not found, creating account')
    this.accounts[id] = new Account({ id, addresses, index: 0, created: Date.now() }, this)
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
    if (address.toLowerCase() !== this.getSelectedAddress().toLowerCase()) return cb(new Error('signMessage: Wrong Account Selected'))
    this.current().signMessage(message, cb)
  }
  signTransaction (rawTx, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    let matchSelected = rawTx.from.toLowerCase() === this.getSelectedAddress().toLowerCase()
    let matchActor = rawTx.from.toLowerCase() === (this.current().smart ? this.current().smart.actor.address.toLowerCase() : false)
    if (matchSelected || matchActor) {
      this.current().signTransaction(rawTx, cb)
    } else {
      cb(new Error('signMessage: Account does not match currently selected'))
    }
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
    this.current().addRequest(req)
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
