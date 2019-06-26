const path = require('path')
const { fork } = require('child_process')

const HotSigner = require('../HotSigner')

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

class RingSigner extends HotSigner {
  constructor (signer) {
    super(signer)
    this.keys = signer.keys
    this.worker = fork(WORKER_PATH)
    setTimeout(() => {
      this.unlock('frame')
      setTimeout(() => {
        this._debug()
      }, 2000)
    }, 3000)
  }

  save () { super.save({ keys: this.keys }) }
  unlock (password) { super.unlock(password, { encryptedKeys: this.keys }) }

  _debug () {
    // Sign message
    this.signMessage(0, 'test', console.log)

    // Sign tx
    let rawTx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x00'
    }
    this.signTransaction(0, rawTx, console.log)

    this.verifyAddress(0, this.addresses[0], console.log)
  }
}

module.exports = RingSigner
