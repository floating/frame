const HDKey = require('hdkey')
const { publicToAddress, toChecksumAddress } = require('ethereumjs-util')

class Signer extends EventEmitter  {
  constructor () {
    super()
    this.addresses = []
    this.status = ''
  }
  deriveHDAccounts (publicKey, chainCode) {
    let hdk = new HDKey()
    hdk.publicKey = Buffer.from(publicKey, 'hex')
    hdk.chainCode = Buffer.from(chainCode, 'hex')
    let derive = index => {
      let derivedKey = hdk.derive(`m/${index}`)
      let address = publicToAddress(derivedKey.publicKey, true)
      return toChecksumAddress(`0x${address.toString('hex')}`)
    }
    const accounts = []
    for (let i = 0; i < 15; i++) { accounts[i] = derive(i) }
    return accounts
  }
  summary () {
    return {
      id: this.id,
      type: this.type,
      index: this.index,
      accounts: this.accounts,
      status: this.status,
      network: this.network,
      requests: this.requests
    }
  }
  update (options = {}) {
    if (options.setView) windows.broadcast('main:action', 'setView', options.setView)
    windows.broadcast('main:action', 'updateSigner', this.summary())
  }
  signMessage (message, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signMessage method.')
  }
  signTransaction (rawTx, cb) {
    console.warn('Signer:' + this.type + ' did not implement a signTransaction method.')
  }
}
