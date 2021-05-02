const log = require('electron-log')
const { isValidAddress } = require('ethereumjs-util')

const abi = require('../../abi')

// Provider Proxy
const proxyProvider = require('../../provider/proxy')

const nebula = require('../../nebula')

const signers = require('../../signers')
const windows = require('../../windows')
const store = require('../../store')

const { Aragon } = require('../aragon')

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

class Account {
  constructor ({ lastSignerType, tokens, name, ensName, created, address, smart, options = {} }, accounts) {
    address = address ? address.toLowerCase() : '0x'
    this.accounts = accounts // Parent Accounts Module
    this.id = address // Account ID
    this.status = 'ok' // Current Status
    this.name = name || capitalize(options.type) + ' Account'
    this.lastSignerType = lastSignerType || options.type
    this.created = created 
    this.address = address
    this.smart = smart
    this.ensName = ensName
    // Update actor to just store actor's address
    if (this.smart && this.smart.actor && this.smart.actor.address) {
      this.smart.actor = this.smart.actor.address.toLowerCase()
    }
    this.tokens = tokens || {}
    this.requests = {}
    this.signer = '' // Matched Signer ID
    if (this.smart && this.smart.type === 'aragon') this.aragon = new Aragon(this.smart)
    this.update(true)
    this.acctObs = store.observer(() => {
      // When signer data changes in any way this will rerun to make sure we're matched correctly
      const updatedSigner = this.findSigner(this.address)

      if (updatedSigner) {
        this.signer = updatedSigner.id
        this.lastSignerType = updatedSigner.type || this.lastSignerType
        if (updatedSigner.status === 'ok') this.verifyAddress((err, verified) => {
          if (err || !verified) this.signer = ''
        })
      } else {
        this.signer = ''
      }
      
      this.smart = this.signer ? undefined : this.smart

      this.update()
    })

    this.accounts.getMainnetBlockHeight((err, height) => {
      if (err) return log.error('getBlockHeight Error', err)
      if (this.created === -1 || !this.created || this.created > height) {
        log.info('Account has no or invalid creation height, fetching')
        log.info('Account creation being set to current height: ', height)
        this.created = height
        this.update()
      }
    })

    this.lookupAddress() // We need to recheck this on every network change... 
    this.update()
  }

  async lookupAddress () {
    try {
      this.ensName = await nebula.ens.lookupAddress(this.address)
      this.update()
    } catch (e) {
      log.error('lookupAddress Error:', e)
      this.ensName = ''
      this.update()
    }
  }

  findSigner (address) {
    const availiableSigners = []
    const signers = store('main.signers')
    Object.keys(signers).forEach(id => {
      if (signers[id].addresses.map(a => a.toLowerCase()).indexOf(address) > -1) {
        availiableSigners.push(signers[id])
      }
    })
    availiableSigners.sort((a, b) => a.status === 'ok' ? -1 : b.status === 'ok' ? -1 : 0)
    const foundSigner = availiableSigners[0]
    return foundSigner
  }

  setAccess (req, access) { // Permissions are not handle by the account
    if (req.address.toLowerCase() === this.address)  {
      store.setPermission(this.address, { handlerId: req.handlerId, origin: req.origin, provider: access })
    }
    if (this.requests[req.handlerId]) {
      if (this.requests[req.handlerId].res) this.requests[req.handlerId].res()
      delete this.requests[req.handlerId]
    }
  }

  updateTokens (tokens) { // Tokens are now handle by the account and need to be included in `update`
    this.tokens = tokens
    this.update()
  }

  resError (error, payload, res) {
    if (typeof error === 'string') error = { message: error, code: -1 }
    log.error(error)
    res({ id: payload.id, jsonrpc: payload.jsonrpc, error: error.message })
  }

  // getBlockHeight (cb) {
  //   if (!proxyProvider.ready) return setTimeout(() => this.getBlockHeight(cb), 1000)
  //   proxyProvider.emit('send', { id: '1', jsonrpc: '2.0', method: 'eth_blockNumber' }, (res) => {
  //     if (res.error || !res.result) return cb(new Error('Unable to get current block height: ' + res.error.message))
  //     cb(null, res.result)
  //   })
  // }

  addRequest (req, res) {
    const add = async r => {
      this.requests[r.handlerId] = req
      this.requests[r.handlerId].mode = 'normal'
      this.requests[r.handlerId].created = Date.now()
      this.requests[r.handlerId].res = res
      this.update()
      windows.showTray()
      windows.broadcast('main:action', 'setSignerView', 'default')
      windows.broadcast('main:action', 'setPanelView', 'default')
      if (req.type === 'transaction' && req && req.data && req.data.data) {
        const { to, data } = req.data
        try {
          const decodedData = await abi.decodeCalldata(to, data)
          if (this.requests[r.handlerId]) {
            this.requests[r.handlerId].decodedData = decodedData
            this.update()
          }
        } catch (e) {
          log.warn(e)
        }
      }
    }
    // Add a filter to make sure we're adding the request to an account that controls the outcome
    if (this.smart) {
      if (this.smart.type === 'aragon') {
        if (req.type === 'transaction') {
          if (!this.aragon) return this.resError('Could not resolve Aragon account', req.payload, res)
          const rawTx = req.data
          rawTx.data = rawTx.data || '0x'
          this.aragon.pathTransaction(rawTx, (err, tx) => {
            if (err) return this.resError(err, req.payload, res)
            Object.keys(tx).forEach(key => { // Number to hex conversion
              if (typeof tx[key] === 'number') tx[key] = '0x' + tx[key].toString(16)
            })
            req.data = tx
            add(req)
          })
        } else {
          add(req)
        }
      } else {
        add(req)
      }
    } else {
      add(req)
    }
  }

  verifyAddress (display, cb = () => {}) {
    if (this.smart && this.smart.actor) {
      const actingAccount = this.accounts.get(this.smart.actor)
      if (!actingAccount) return cb(new Error('Could not find acting account', this.smart.actor))
      const actingSigner = signers.get(actingAccount.signer)
      if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error('Could not find acting account signer', actingAccount.signer))
      const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
      if (index > -1) {
        actingSigner.verifyAddress(index, actingAccount.address, display, cb)
      } else {
        log.info('Could not find address in signer')
        cb(new Error('Could not find address in signer'))
      }
    } else if (this.signer && signers.get(this.signer) && signers.get(this.signer).verifyAddress) {
      const s = signers.get(this.signer)
      const index = s.addresses.map(a => a.toLowerCase()).indexOf(this.address)
      if (index > -1) {
        s.verifyAddress(index, this.address, display, cb)
      } else {
        log.info('Could not find address in signer')
        cb(new Error('Could not find address in signer'))
      }
    } else {
      log.info('No signer active to verify address')
      cb(new Error('No signer active to verify address'))
    }
  }

  getSelectedAddresses () {
    return [this.address]
  }

  getSelectedAddress () {
    return this.address
  }

  summary () {
    const update = JSON.parse(JSON.stringify({
      id: this.id,
      network: this.network,
      name: this.name,
      lastSignerType: this.lastSignerType,
      address: this.address,
      status: this.status,
      signer: this.signer,
      smart: this.smart,
      requests: this.requests,
      ensName: this.ensName,
      // permissions: this.permissions,
      tokens: this.tokens,
      created: this.created
    }))
    if (update.smart && update.smart.actor && update.smart.actor.account) {
      update.signer = update.smart.actor.account.signer
      if (update.signer) update.signer.type = 'aragon'
    }
    return update
  }

  update (add) {
    this.accounts.update(this.summary(), add)
  }

  delete () {

  }

  rename (name) {
    this.name = name
    this.update()
  }

  getCoinbase (cb) {
    cb(null, [this.address])
  }

  getAccounts (cb) {
    const account = this.address
    if (cb) cb(null, account ? [account] : [])
    return account ? [account] : []
  }

  open () {
    windows.broadcast('main:action', 'addSigner', this.summary())
  }

  close () {
    this.acctObs.remove()
  }

  signMessage (message, cb) {
    if (!message) return cb(new Error('No message to sign'))
    if (this.signer) {
      const s = signers.get(this.signer)
      if (!s) return cb(new Error(`Cannot find signer for this account`))
      const index = s.addresses.map(a => a.toLowerCase()).indexOf(this.address)
      if (index === -1) cb(new Error(`Signer cannot sign for this address`))
      s.signMessage(index, message, cb)
    } else if (this.smart) {
      if (this.smart && this.smart.actor) {
        const actingAccount = this.accounts.get(this.smart.actor)
        if (!actingAccount) return cb(new Error('Could not find acting account', this.smart.actor))
        const actingSigner = signers.get(actingAccount.signer)
        if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error('Could not find acting account signer', actingAccount.signer))
        const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
        if (index === -1) cb(new Error(`Acting signer cannot sign for this address, could not find address in signer`))
        actingSigner.signMessage(index, message, cb)
      } else {
        cb(new Error(`Agent's (${this.smart.agent}) signer is not ready`))
      }
    } else {
      cb(new Error('No signer found for this account'))
    }
  }

  signTypedData (typedData, cb) {
    if (!typedData) return cb(new Error('No data to sign'))
    if (typeof (typedData) !== 'object') return cb(new Error('Data to sign has the wrong format'))
    if (this.signer) {
      const s = signers.get(this.signer)
      if (!s) return cb(new Error(`Cannot find signer for this account`))
      const index = s.addresses.map(a => a.toLowerCase()).indexOf(this.address)
      if (index === -1) cb(new Error(`Signer cannot sign for this address`))
      s.signTypedData(index, typedData, cb)
    } else if (this.smart && this.smart.actor) {
      const actingAccount = this.accounts.get(this.smart.actor)
      if (!actingAccount) return cb(new Error('Could not find acting account', this.smart.actor))
      const actingSigner = signers.get(actingAccount.signer)
      if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error('Could not find acting account signer', actingAccount.signer))
      const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
      if (index === -1) cb(new Error(`Acting signer cannot sign for this address, could not find acting address in signer`, actingAccount.address))
      actingSigner.signTypedData(index, typedData, cb)
    } else {
      cb(new Error('No signer found for this account'))
    }
  }

  signTransaction (rawTx, cb) {
    this._validateTransaction(rawTx, (err) => {
      if (err) return cb(err)
      if (this.signer) {
        const s = signers.get(this.signer)
        if (!s) return cb(new Error(`Cannot find signer for this account`))
        const index = s.addresses.map(a => a.toLowerCase()).indexOf(this.address)
        if (index === -1) cb(new Error(`Signer cannot sign for this address`))
        s.signTransaction(index, rawTx, cb)
      } else if (this.smart && this.smart.actor) {
        const actingAccount = this.accounts.get(this.smart.actor)
        if (!actingAccount) return cb(new Error('Could not find acting account', this.smart.actor))
        const actingSigner = signers.get(actingAccount.signer)
        if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error('Could not find acting account signer', actingAccount.signer))
        const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
        if (index === -1) cb(new Error(`Acting signer cannot sign for this address, could not find acting address in signer`, actingAccount.address))
        actingSigner.signTypedData(index, rawTx, cb)
      } else {
        cb(new Error('No signer found for this account'))
      }
    })
  }

  _validateTransaction (rawTx, cb) {
    // Validate 'from' address
    if (!rawTx.from) return new Error('Missing \'from\' address')
    if (!isValidAddress(rawTx.from)) return cb(new Error('Invalid \'from\' address'))

    // Ensure that transaction params are valid hex strings
    const enforcedKeys = ['value', 'data', 'to', 'from', 'gas', 'gasPrice', 'gasLimit', 'nonce']
    const keys = Object.keys(rawTx)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (enforcedKeys.indexOf(key) > -1 && !this._isValidHexString(rawTx[key])) {
        // Break on first error
        cb(new Error(`Transaction parameter '${key}' is not a valid hex string`))
        break
      }
    }
    return cb(null)
  }

  _isValidHexString (string) {
    const pattern = /^0x[0-9a-fA-F]*$/
    return pattern.test(string)
  }
}

module.exports = Account
