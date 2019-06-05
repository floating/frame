const signers = require('../../signers')
const windows = require('../../windows')
const store = require('../../store')

const HDKey = require('hdkey')
const { publicToAddress, toChecksumAddress } = require('ethereumjs-util')

class Account {
  constructor (account, accounts) {
    this.accounts = accounts
    this.id = account.id
    this.index = account.index
    this.status = 'ok'
    this.name = account.name || ''
    this.type = 'Regular'
    this.created = account.created
    this.addresses = account.addresses
    this.signer = account.signer
    this.agent = account.agent
    this.requests = {}

    // Look for matching signers for account, if account has an agent look for matching agent account
    let signer = signers.get(this.id)
    if (signer) {
      this.updateSigner(signer.summary())
    } else if (this.agent) {
      let agentAccount = accounts.get(this.agent.id)
      if (agentAccount) this.updateAgent(agentAccount.summary())
    }

    // Subscribe to updates to both signers and accounts
    signers.on('update', signer => {
      if (signer.id === this.id) this.updateSigner(signer)
    })
    accounts.on('update', account => {
      if (account.id === this.agent.id) this.updateAgent(account)
    })
    store.updateAccount(this.summary())
  }
  getSelectedAddresses () {
    return [this.addresses[this.index]]
  }
  getSelectedAddress () {
    return this.addresses[this.index]
  }
  setIndex (i, cb) {
    this.index = i
    this.requests = {} // TODO Decline these requests before clobbering them
    store.updateAccount(this.summary())
    cb(null, this.summary())
  }
  updateAgent (agent) {
    if (agent) {
      this.agent.id = agent.id
      this.agent.account = agent
      this.signer = agent.signer
      this.update()
    }
  }
  updateSigner (signer) {
    if (signer) {
      this.signer = signer
      this.agent = false
      this.update()
    }
  }
  summary () {
    return JSON.parse(JSON.stringify({
      id: this.id,
      index: this.index,
      type: this.type,
      addresses: this.addresses,
      status: this.status,
      signer: this.signer,
      agent: this.agent,
      requests: this.requests
    }))
  }
  update () {
    this.accounts.update(this.summary())
  }
  delete () {

  }
  deriveHDAccounts (publicKey, chainCode, count = 100) {
    let hdk = new HDKey()
    hdk.publicKey = Buffer.from(publicKey, 'hex')
    hdk.chainCode = Buffer.from(chainCode, 'hex')
    let derive = index => {
      let derivedKey = hdk.derive(`m/${index}`)
      let address = publicToAddress(derivedKey.publicKey, true)
      return toChecksumAddress(`0x${address.toString('hex')}`)
    }
    const accounts = []
    for (let i = 0; i < count; i++) { accounts[i] = derive(i) }
    return accounts
  }
  getCoinbase (cb) {
    cb(null, this.addresses[0])
  }
  getAccounts (cb) {
    let account = this.addresses[this.index]
    if (cb) cb(null, account ? [account] : [])
    return account ? [account] : []
  }
  open () {
    windows.broadcast('main:action', 'addSigner', this.summary())
  }
  close () {
    windows.broadcast('main:action', 'removeSigner', this.summary())
  }
  signMessage (message, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signMessage method.')
  }
  signTransaction (rawTx, cb) {
    if (this.signer) {
      signers.get(this.signer.id).signTransaction(this.index, rawTx, cb)
    } else if (this.agent) {
      if (this.agent.signer) {
        signers.get(this.agent.signer.id).signTransaction(this.index, rawTx, cb)
      } else {
        cb(new Error(`Agent (${this.agent.address}) signer is not ready`))
      }
    } else {
      cb(new Error(`No signer forund for this account`))
    }
  }
}

module.exports = Account
