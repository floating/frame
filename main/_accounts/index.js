const EventEmitter = require('events')
const hdKey = require('ethereumjs-wallet/hdkey')
const log = require('electron-log')
// const bip39 = require('bip39')

const crypt = require('../crypt')
const store = require('../store')
const _signers = require('../_signers')

class Account {
  constructor (account, accounts) {
    this.id = account.id
    this.type = account.type
    this.name = account.name
    this.addresses = account.addresses
    this.aliases = account.aliases
    this.requests = account.requests
    this.permissions = account.permissions
    this.signer = { status: 'none' } // For external accounts
    this.forwarder = { id: '', address: '', status: 'none' } // For smart accounts
    _signers.on('update', signer => {
      if (signer.id === this.id) {
        this.signer = signer // _signers[this.id].summary()
        this.update()
      }
    })
    accounts.on('update', account => {
      if (account.id === this.forwarder.id) {
        // this account is a forwarder, for this account
        this.forwarder = account
        this.update()
      }
    })
  }
  summary () {
    return {
      id: this.id,
      type: this.type,
      addresses: this.addresses,
      status: this.status,
      network: this.network,
      requests: this.requests,
      signer: this.signer,
      forwarder: this.forwarder
    }
  }
  delete () {
    // let id = this.id()
    // remove from storage by id
    // signers.removeListener('update', this.signerUpdate.bind(this))
  }
  update () {
    // emit an account update
  }
  // signerUpdate (signer) {
  //   if (signer.id === this.id()) {
  //     this.signer = signer
  //     this.update()
  //   }
  // }
}
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
    this.accounts = {}
    let stored = store('main._accounts')
    Object.keys(stored).forEach(id => {
      this.accounts[id] = new Account(stored[id], this)
    })
    _signers.on('add', signer => {
      log.info('[Accounts] Signer added')
      if (!this.accounts[signer.id]) {
        log.info('[Accounts] No account matched this new signer, creating account')
        this.add(signer.addresses)
      } else {
        log.info('[Accounts] An existing account matched the added signer')
      }
    })
  }
  list () {
    return this.accounts.map(account => account.summary())
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
    log.info('accounts.add')
    const accounts = store('main._accounts')
    const id = this.addressesToId(addresses)
    if (accounts[id]) {
      log.info('Account already exists')
      cb(null, accounts[id])
    } else {
      log.info('Account not found, creating account')
      const account = { id, addresses, permissions: {}, created: Date.now() }
      store.newAccount(account)
      this.accounts[id] = new Account(store('main._accounts', id), this)
      this.emit('add', this.accounts[id].summary())
    }
  }
  update (account) {
    log.info('Account update called')
    this.emit('update', account)
  }
}

module.exports = new Accounts()
