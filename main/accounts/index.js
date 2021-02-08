const EventEmitter = require('events')
const hdKey = require('hdkey')
const log = require('electron-log')
const publicKeyToAddress = require('ethereum-public-key-to-address')
const { shell, Notification } = require('electron')

// const bip39 = require('bip39')

const crypt = require('../crypt')
const store = require('../store')
const tokens = require('../tokens')

// Provider Proxy
const proxyProvider = require('../provider/proxy')

const Account = require('./Account')
const windows = require('../windows')

// const weiToGwei = v => Math.ceil(v / 1e9)
const gweiToWei = v => Math.ceil(v * 1e9)
const intToHex = v => '0x' + v.toString(16)
const hexToInt = v => parseInt(v, 'hex')
const weiHexToGweiInt = v => hexToInt(v) / 1e9
const gweiToWeiHex = v => intToHex(gweiToWei(v))

const notify = (title, body, action) => {
  const notification = { title, body }
  const note = new Notification(notification)
  note.on('click', action)
  setTimeout(() => note.show(), 1000)
}

const FEE_MAX = 2 * 1e18

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
    windows.events.on('tray:show', () => {
      this.tokenScan(true)
    })
    windows.events.on('tray:hide', () => {
      this.stopTokenScan()
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
    const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex'))
    const addresses = []
    for (let i = 0; i < 100; i++) {
      const publicKey = wallet.derive('m/44\'/60\'/0\'/0/' + i).publicKey
      const address = publicKeyToAddress(publicKey)
      addresses.push(address)
    }
    return addresses
  }

  fingerprint (network, addresses) {
    return crypt.stringToKey(network + addresses.join()).toString('hex')
  }

  // Public
  addAragon (account, cb = () => {}) {
    if (account.addresses.length === 0) return cb(new Error('No addresses, will not add account'))
    account.network = account.network || store('main.currentNetwork.id')
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
    const network = store('main.currentNetwork.id')
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

  updateNonce (reqId, nonce) {
    log.info('Update Nonce: ', reqId, nonce)
    const req = this.current().requests[reqId]
    if (req.type === 'transaction') req.data.nonce = nonce
    this.current().update()
    return req
  }

  removeRequestWarning (reqId) {
    log.info('removeRequestWarning: ', reqId)
    delete this.current().requests[reqId].warning
    this.current().update()
  }

  checkBetterGasPrice () {
    const { id, type } = store('main.currentNetwork')
    const gas = store('main.networks', type, id, 'gas.price')
    if (gas && this.current() && this.current().network === id && gas.selected !== 'custom') {
      Object.keys(this.current().requests).forEach(id => {
        const req = this.current().requests[id]
        if (req.type === 'transaction' && req.data.gasPrice) {
          const setPrice = weiHexToGweiInt(req.data.gasPrice)
          const currentPrice = weiHexToGweiInt(gas.levels[gas.selected])
          if (isNaN(setPrice) || isNaN(currentPrice)) return
          if (currentPrice < setPrice) {
            req.data.gasPrice = gweiToWeiHex(currentPrice)
            this.current().update()
          }
        }
      })
    }
  }

  async replaceTx (id, type) {
    return new Promise((resolve, reject) => {
      if (!this.current().requests[id]) return reject(new Error('Could not find request'))
      if (this.current().requests[id].type !== 'transaction') return reject(new Error('Request is not transaction'))
      const data = JSON.parse(JSON.stringify(this.current().requests[id].data))
      const network = store('main.currentNetwork')
      const { levels } = store('main.networks', network.type, network.id, 'gas.price')

      // Set the gas default to asap
      store.setGasDefault(network.type, network.id, 'asap', levels.asap)

      const tx = {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendTransaction'
      }

      if (type === 'speed') {
        tx.params = [data]
      } else {
        tx.params = [{
          from: this.current().getSelectedAddress(),
          to: this.current().getSelectedAddress(),
          value: '0x0',
          nonce: data.nonce,
          _origin: this.current().requests[id].origin
        }]
      }

      proxyProvider.emit('send', tx, res => {
        if (res.error) return reject(new Error(res.error))
        resolve()
      })
    })
  }

  async confirmations (id, hash) {
    return new Promise((resolve, reject) => {
      proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_blockNumber', params: [] }, (res) => {
        if (res.error) return reject(new Error(res.error))
        proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [hash] }, receiptRes => {
          if (receiptRes.error) return reject(new Error(receiptRes.error))
          if (receiptRes.result && this.current().requests[id]) {
            this.current().requests[id].tx.receipt = receiptRes.result
            if (receiptRes.result.status === '0x1' && this.current().requests[id].status === 'verifying') {
              this.current().requests[id].status = 'confirming'
              this.current().requests[id].notice = 'Confirming'
              this.current().requests[id].completed = Date.now()
              const { hash } = this.current().requests[id].tx
              const h = hash.substr(0, 6) + '...' + hash.substr(hash.length - 4)
              const body = `Transaction ${h} sucessful! \n Click for details`

              // Drop any other pending txs with same nonce
              Object.keys(this.current().requests).forEach(k => {
                const reqs = this.current().requests
                if (reqs[k].status === 'verifying' && reqs[k].data.nonce === reqs[id].data.nonce) {
                  this.current().requests[k].status = 'error'
                  this.current().requests[k].notice = 'Dropped'
                }
              })

              // If Frame is hidden, trigger native notification
              notify('Transaction Successful', body, () => {
                const { type, id } = store('main.currentNetwork')
                const explorer = store('main.networks', type, id, 'explorer')
                shell.openExternal(explorer + '/tx/' + hash)
              })
            }
            const blockHeight = parseInt(res.result, 16)
            const receiptBlock = parseInt(this.current().requests[id].tx.receipt.blockNumber, 16)
            resolve(blockHeight - receiptBlock)
          }
        })
      })
    })
  }

  async txMonitor (id, hash) {
    this.current().requests[id].tx = { hash, confirmations: 0 }
    this.current().update()
    proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_subscribe', params: ['newHeads'] }, newHeadRes => {
      if (newHeadRes.error) {
        log.warn(newHeadRes.error)
        const monitor = async () => {
          let confirmations
          try {
            confirmations = await this.confirmations(id, hash)
          } catch (e) {
            log.error(e)
            clearTimeout(monitorTimer)
            return
          }
          this.current().requests[id].tx.confirmations = confirmations
          this.current().update()
          if (confirmations > 12) {
            this.current().requests[id].status = 'confirmed'
            this.current().requests[id].notice = 'Confirmed'
            this.current().update()
            clearTimeout(monitorTimer)
          }
        }
        setTimeout(() => monitor(), 3000)
        const monitorTimer = setInterval(monitor, 15000)
      } else if (newHeadRes.result) {
        const headSub = newHeadRes.result
        const handler = async payload => {
          if (payload.method === 'eth_subscription' && payload.params.subscription === headSub) {
            // const newHead = payload.params.result
            let confirmations
            try {
              confirmations = await this.confirmations(id, hash)
            } catch (e) {
              log.error(e)
              proxyProvider.removeListener('data', handler)
              return
            }
            this.current().requests[id].tx.confirmations = confirmations
            this.current().update()
            if (confirmations > 12) {
              this.current().requests[id].status = 'confirmed'
              this.current().requests[id].notice = 'Confirmed'
              this.current().update()
              proxyProvider.removeListener('data', handler)
              proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_unsubscribe', params: [headSub] })
            }
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
    tokens.kill()
    // usbDetect.stopMonitoring()
  }

  setSignerIndex (index, cb) {
    if (!this.current()) return cb(new Error('No Account Selected'))
    this.current().setIndex(index, cb)
  }

  addRequest (req, res) {
    log.info('addRequest', JSON.stringify(req))
    if (!this.current() || this.current().requests[req.handlerId]) return // If no current signer or the request already exists
    this.current().addRequest(req, res)
  }

  removeRequest (handlerId) {
    if (this.current() && this.current().requests[handlerId]) {
      if (this.current().requests[handlerId].res) this.current().requests[handlerId].res()
      delete this.current().requests[handlerId]
      this.current().update()
    }
  }

  declineRequest (handlerId) {
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId]) {
      this.current().requests[handlerId].status = 'error'
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
      if (this.current().requests[handlerId].status === 'declined' || this.current().requests[handlerId].status === 'error') {
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
      this.current().requests[handlerId].notice = 'Successful'
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

  setGasPrice (price, handlerId, cb) {
    if (!price || isNaN(parseInt(price, 'hex')) || parseInt(price, 'hex') < 0) return cb(new Error('Invalid price'))
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId] && this.current().requests[handlerId].type === 'transaction') {
      if (parseInt(price, 'hex') > 9999 * 1e9) price = '0x' + (9999 * 1e9).toString(16)
      const gasLimit = this.current().requests[handlerId].data.gas
      if (parseInt(price, 'hex') * parseInt(gasLimit, 'hex') > FEE_MAX) {
        log.warn('setGasPrice operation would set fee over hard limit')
        price = '0x' + Math.floor(FEE_MAX / parseInt(gasLimit, 'hex')).toString(16)
      }
      this.current().requests[handlerId].data.gasPrice = price
      this.current().update()
      cb()
    }
  }

  adjustNonce (handlerId, nonceAdjust) {
    if (nonceAdjust !== 1 && nonceAdjust !== -1) return log.error('Invalid nonce adjustment', nonceAdjust)
    if (!this.current()) return log.error('No account selected during nonce adjustement', nonceAdjust)
    if (this.current().requests[handlerId] && this.current().requests[handlerId].type === 'transaction') {
      const nonce = this.current().requests[handlerId].data && this.current().requests[handlerId].data.nonce
      if (nonce) {
        const adjustedNonce = '0x' + (parseInt(nonce, 'hex') + nonceAdjust).toString(16)
        this.current().requests[handlerId].data.nonce = adjustedNonce
        this.current().update()
      } else {
        const { from } = this.current().requests[handlerId].data
        proxyProvider.emit('send', { id: 1, jsonrpc: '2.0', method: 'eth_getTransactionCount', params: [from, 'pending'] }, (res) => {
          if (res.result) {
            const newNonce = parseInt(res.result, 'hex')
            const adjustedNonce = '0x' + (nonceAdjust === 1 ? newNonce : newNonce + nonceAdjust).toString(16)
            this.current().requests[handlerId].data.nonce = adjustedNonce
            this.current().update()
          }
        })
      }
    }
  }

  tokenScan (knownOnly) {
    const address = this.getSelectedAddress()
    if (!address) return // log.info('token scan no address')
    const addressTokens = store('main.addresses', address, 'tokens')
    const omit = addressTokens && addressTokens.omit
    const known = addressTokens && knownOnly && Object.keys(addressTokens.known || {})
    tokens.scan(address, omit, known)
  }

  stopTokenScan () {
    tokens.stop()
  }

  setGasLimit (limit, handlerId, cb) {
    if (!limit || isNaN(parseInt(limit, 'hex')) || parseInt(limit, 'hex') < 0) return cb(new Error('Invalid limit'))
    if (!this.current()) return // cb(new Error('No Account Selected'))
    if (this.current().requests[handlerId] && this.current().requests[handlerId].type === 'transaction') {
      if (parseInt(limit, 'hex') > 12.5e6) limit = '0x' + (12.5e6).toString(16)
      const gasPrice = this.current().requests[handlerId].data.gasPrice
      if (parseInt(limit, 'hex') * parseInt(gasPrice, 'hex') > FEE_MAX) {
        log.warn('setGasLimit operation would set fee over hard limit')
        limit = '0x' + Math.floor(FEE_MAX / parseInt(gasPrice, 'hex')).toString(16)
      }
      this.current().requests[handlerId].data.gas = limit
      this.current().update()
      cb()
    }
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
