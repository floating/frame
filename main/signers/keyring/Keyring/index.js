const EthTx = require('ethereumjs-tx')
const { hashPersonalMessage, toBuffer, ecsign, privateToAddress, addHexPrefix } = require('ethereumjs-util')
const Signer = require('../../Signer')
const HdKeyring = require('eth-hd-keyring')
const AragonKeyring = require('eth-aragon-keyring')
const EthereumTx = require('ethereumjs-tx')
const MultiplexedProvider = require('./multiplexed-provider')


class Keyring extends Signer {
  constructor (account) {
    super()
    this.type = "hot"
    this.id = account.id


    switch(account.type){
      case HdKeyring.type:
        this.keyring = new HdKeyring(account.opts);
        break;
      case AragonKeyring.type:
        this.keyring = new AragonKeyring(account.opts);
        break;
    }

    this.keyring.getAccounts().then(accounts => {
      this.accounts = accounts
      this.status = 'ok'
      this.open()
    })
  }
  // Standard Methods
  signPersonal (message, cb) {
    this.keyring.signPersonalMessage(this.accounts[0], message).then(hex => {
        cb(null, addHexPrefix(hex))
    })

  }
  setProvider (provider,transactionFunction) {
    if(this.keyring.setProvider){
      const mProvider = new MultiplexedProvider(provider)
      this.keyring.setProvider(mProvider,transactionFunction)
    }
  }
  signTransaction (rawTx, cb) {
    const tx = new EthereumTx(rawTx)

    this.keyring.signTransaction(this.accounts[0], tx).then(res => {
      cb(null, '0x' + tx.serialize().toString('hex'))
    })
  }
}

module.exports = Keyring
