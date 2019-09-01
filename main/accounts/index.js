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

class Accounts extends EventEmitter {
  constructor () {
    super()
    this._current = ''
    this.accounts = {}
    const stored = store('main.accounts')
    Object.keys(stored).forEach(id => {
      this.accounts[id] = new Account(JSON.parse(JSON.stringify(stored[id])), this)
    })
    store.observer(() => {
      const signers = store('main.signers')
      Object.keys(signers).forEach(id => {
        const type = store('main.signers', id, 'type')
        if (!this.accounts[id]) this.add(signers[id].addresses, { type })
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

  fingerprint (network, addresses) {
    return crypt.stringToKey(network + addresses.join()).toString('hex')
  }

  // Public
  addAragon (account, cb = () => {}) {
    if (account.addresses.length === 0) return cb(new Error('No addresses, will not add account'))
    account.network = account.network || store('main.connection.network')
    account.id = this.fingerprint(account.network, account.addresses)
    account.options = account.options || {}
    const existing = store('main.accounts', account.id)
    if (existing && existing.network === account.network) return cb(null, existing) // Account already exists...
    log.info('Aragon account not found, creating account')
    account.options.type = 'aragon'
    this.accounts[account.id] = new Account(account, this)
    cb(null, this.accounts[account.id].summary())
  }

  add (addresses, options = {}, cb = () => {}) {
    if (addresses.length === 0) return cb(new Error('No addresses, will not add account'))
    const network = store('main.connection.network')
    const id = this.fingerprint(network, addresses)
    const account = store('main.accounts', id)
    if (account && account.network === network) return cb(null, account) // Account already exists...
    log.info('Account not found, creating account')
    this.accounts[id] = new Account({ id, addresses, index: 0, network, created: -1, options }, this)
  }

  rename (id, name) { this.accounts[id].rename(name) }

  update (account, add) {
    store.updateAccount(account, add)
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
                const blockHeight = parseInt(newHead.number, 16)
                const receiptBlock = parseInt(this.current().requests[id].tx.receipt.blockNumber, 16)
                const confirmations = blockHeight - receiptBlock
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
    const signerSummary = {}
    Object.keys(this.accounts).forEach(id => {
      const summary = this.accounts[id].summary()
      if (summary.status === 'Invalid sequence' || summary.status === 'initial') return
      signerSummary[id] = summary
    })
    cb(null, signerSummary)
  }

  setSigner (id, cb) {
    this.accounts[id].setIndex(this.accounts[id].index, err => {
      if (err) return cb(err)
      this._current = id
      const summary = this.current().summary()
      cb(null, summary)
      windows.broadcast('main:action', 'setSigner', summary)
    })
  }

  unsetSigner (cb) {
    const s = this.current()
    this._current = null
    const summary = { id: '', type: '', accounts: [], status: '', index: 0 }
    if (cb) cb(null, summary)
    windows.broadcast('main:action', 'unsetSigner', summary)
    setTimeout(() => { // Clear signer requests when unset
      if (s) {
        s.requests = {}
        s.update()
      }
    })
  }

  verifyAddress (display, cb) {
    if (this.current() && this.current().verifyAddress) this.current().verifyAddress(display, cb)
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

  signTypedData (address, typedData, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    if (address.toLowerCase() !== this.getSelectedAddress().toLowerCase()) return cb(new Error('signMessage: Wrong Account Selected'))
    this.current().signTypedData(typedData, cb)
  }

  signTransaction (rawTx, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    const matchSelected = rawTx.from.toLowerCase() === this.getSelectedAddress().toLowerCase()
    const matchActor = rawTx.from.toLowerCase() === (this.current().smart ? this.current().smart.actor.address.toLowerCase() : false)
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
    const handlerId = req.handlerId
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
        const notice = err && typeof err === 'string' ? err : err && typeof err === 'object' && err.message && typeof err.message === 'string' ? err.message : 'Unknown Error' // TODO: Update to normalize input type
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

  remove (id) {
    windows.broadcast('main:action', 'unsetSigner')
    setTimeout(() => {
      if (this.accounts[id]) this.accounts[id].close()
      store.removeAccount(id)
      delete this.accounts[id]
    }, 1000)
  }

  // removeAllAccounts () {
  //   windows.broadcast('main:action', 'unsetSigner')
  //   setTimeout(() => {
  //     Object.keys(this.accounts).forEach(id => {
  //       if (this.accounts[id]) this.accounts[id].close()
  //       store.removeAccount(id)
  //       delete this.accounts[id]
  //     })
  //   }, 1000)
  // }
}

module.exports = new Accounts()
