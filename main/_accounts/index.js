const EventEmitter = require('events')
const hdKey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')

const crypt = require('../crypt')
const store = require('../store')
const signers = require('../_signers')

class Account extends EventEmitter {
  constructor (account, accounts) {
    super()
    this.id = account.id
    this.type = account.type
    this.name = account.name
    this.addresses = account.addresses
    this.aliases = account.aliases
    this.requests = account.requests
    this.permissions = account.permissions
    this.signer = { status: 'none' } // For external accounts
    this.forwarder = { id: '', address: '', status: 'none' } // For smart accounts
    signers.on('update', signer => {
      if (signer.id === this.id) {
        this.signer = signers[this.id].summary()
        this.update()
      }
    })
    accounts.on('update', account => {
      if (account.id === this.forwarder.id) {
        // this account is a forwarder, for this account
      }
    })
  }
  signerUpdate () {

  }
  forwaderUpdate () {

  }
  summary () {
    return {
      id: this.id,
      type: this.type,
      // index: this.index,
      addresses: this.addresses,
      status: this.status,
      network: this.network,
      requests: this.requests,
      signer: this.signer
    }
  }
  id () {
    return this.id
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
class Accounts extends EventEmitter {
  constructor () {
    super()
    let accounts = Object.keys(store('main._accounts')).map(id => store('main._accounts', id))
    accounts.sort((a, b) => a.created - b.created)
    this.accounts = accounts.map(account => new Account(account, this))
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
  addLocalAccount (phrase, password, cb) {
    if (!bip39.validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase'))
    bip39.mnemonicToSeed(phrase).then(seed => {
      signers.newLocal(seed, password, err => {
        if (err) return cb(err)
        crypt.encrypt(phrase, password, (err, encryptedPhrase) => {
          if (err) return cb(err)
          const addresses = this.seedToAddresses(seed)
          const id = this.addressesToId(addresses)
          // if (store('main', '_accounts', id)) return cb(new Error('Account already exists'))
          const account = {
            id,
            addresses,
            type: 'hot',
            aliases: addresses.map(() => ''),
            // phrase: encryptedPhrase, // Only hot
            created: Date.now()
          }
          store.newAccount(account)
          cb(null, account)
        })
      })
    }).catch(err => cb(err))
  }
  removeAccount (id) {

  }
}

const accounts = new Accounts()

const mnemonic = 'duck daring trouble employ million bamboo stock seed refuse example glimpse flame'
const password = 'frame'

console.log(accounts.list())
accounts.addLocalAccount(mnemonic, password, (err, account) => {
  if (err) return console.log(err)
  // console.log(account)
  // console.log(account.id)
})
