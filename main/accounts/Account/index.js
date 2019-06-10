const utils = require('ethereumjs-util')
const Aragon = require('@aragon/wrapper').default

const signers = require('../../signers')
const windows = require('../../windows')
const store = require('../../store')

class Account {
  constructor ({ id, type, index, name, created, addresses, smart }, accounts) {
    this.accounts = accounts
    this.id = id
    this.index = index || 0
    this.status = 'ok'
    this.name = name || ''
    this.type = type || 'Default'
    this.created = created
    this.addresses = addresses || ['0x']
    this.smart = smart
    this.requests = {}
    store.observer(() => {
      if (this.smart && this.smart.actor && this.smart.actor.id && this.smart.actor.id !== this.id) {
        this.smart.actor.account = store('main.accounts', this.smart.actor.id)
        this.signer = undefined
      }
      this.signer = store('main.signers', this.id)
      this.smart = this.signer ? undefined : this.smart
      this.update()
    })
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
    this.update()
    cb(null, this.summary())
  }
  summary () {
    const update = JSON.parse(JSON.stringify({
      id: this.id,
      index: this.index,
      type: this.type,
      addresses: this.addresses,
      status: this.status,
      signer: this.signer,
      smart: this.smart,
      requests: this.requests
    }))
    if (update.smart && update.smart.actor && update.smart.actor.account) {
      update.signer = update.smart.actor.account.signer
      update.signer.type = 'Agent'
    }
    return update
  }
  update () {
    this.accounts.update(this.summary())
  }
  delete () {

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
    } else if (this.smart) {
      if (this.smart.actor && this.smart.actor.account && this.smart.actor.account.signer) {
        if (this.smart.type === 'aragon') {
          this.aragonSignTransaction(rawTx, cb)
        } else {
          cb(new Error(`No valid handler for smart account transaction...`))
        }
      } else {
        cb(new Error(`Agent's (${this.smart.agent}) signer is not ready`))
      }
    } else {
      cb(new Error(`No signer forund for this account`))
    }
  }
  bufferToHex (value) {
    return utils.bufferToHex(value)
  }
  aragon (cb) {
    if (this.aragonWrapper) return cb(null, this.aragonWrapper)
    const aragonWrapper = new Aragon(this.smart.dao) //  { apm: { ipfs: { gateway: 'https://ipfs.eth.aragon.network/ipfs' } } })
    aragonWrapper.init().then(() => cb(null, this.aragonWrapper)).catch(cb)
  }
  aragonSignTransaction (rawTx, cb) {
    this.aragon((err, wrap) => {
      if (err) return cb(err)
      const tx = {
        from: this.smart.agent, // Agent address
        to: this.bufferToHex(rawTx.to),
        gasPrice: this.bufferToHex(rawTx.gasPrice),
        gasLimit: this.bufferToHex(rawTx.gasLimit),
        value: this.bufferToHex(rawTx.value) || '0x',
        data: this.bufferToHex(rawTx.data)
      }
      wrap.calculateTransactionPath(this.smart.actor.address, this.smart.agent, 'execute', [tx.to, tx.value, tx.data]).then(result => {
        console.log(result)
      }).catch(cb)
    })
  }
  aragonSignMessage (message, cb) {
    this.aragon((err, wrap) => {
      if (err) return cb(err)
      const params = ['0x' + utils.keccak(message).toString('hex')]
      wrap.calculateTransactionPath(this.smart.actor.address, this.smart.agent, 'presignHash', params).then(result => {
        console.log(result)
      }).catch(cb)
    })
  }
}

module.exports = Account
