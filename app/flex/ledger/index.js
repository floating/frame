import 'babel-polyfill'

// Libraries
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble'
import AppEth from '@ledgerhq/hw-app-eth'

class Ledger {
  constructor (emit) {
    this.emit = emit
    this.signers = {}
  }
  current (cb) {
    // Return current signer summaries
    let s = {}
    Object.keys(this.signers).map(id => { s[id] = this.summary(id) })
    cb(null, s)
  }
  summary (id) {
    return {
      id: this.signers[id].id,
      status: this.signers[id].status,
      statusMessage: this.signers[id].statusMessage,
      publicKey: this.signers[id].publicKey,
      address: this.signers[id].address,
      chainId: this.signers[id].chainId
    }
  }
  async getAddress (id, path, verify, chainId, cb) {
    console.log(id, path, verify, chainId, cb)
    try {
      // const transport = await TransportWebBLE.create()
      const eth = new AppEth(this.signers[id].transport)
      cb(null, await eth.getAddress(path, false, true))
      // transport.close()
    } catch (err) {
      cb(err)
    }
  }
  update (id) {
    this.emit('ledger:device:update', this.summary(id))
  }
  async getDeviceInfo (id) {
    const eth = new AppEth(this.signers[id].transport)
    const path = `44'/60'/0'/0/0` // HD derivation path
    const result = await eth.getAddress(path, false, true)
    this.signers[id].publicKey = result.publicKey
    this.signers[id].address = result.address
    this.signers[id].chainId = result.chainId
    this.signers[id].status = 'ready'
    this.signers[id].statusMessage = ''
    this.emit('ledger:device:added', this.summary(id))
    this.update(id)
  }
  async addDevice (transport) {
    let id = transport.device.id
    this.signers[id] = { id, transport, status: 'pending' }
    this.emit('ledger:device:added', this.summary(id))
    try {
      this.getDeviceInfo(id)
    } catch (err) {
      this.signers[id].status = 'error'
      this.signers[id].statusMessage = err.message
      this.update(id)
    }
  }
  async getTransport () {

  }
  async scan () {
    let cancled = false
    const error = err => {
      cancled = true
      this.emit('ledger:scan:failed', err)
    }
    try {
      const timer = setTimeout(() => {
        if (cancled) return
        error(new Error('Time limit reached...'))
      }, 20000)
      const transport = await TransportWebBLE.create()
      if (cancled) return
      clearTimeout(timer)
      this.addDevice(transport)
    } catch (err) {
      error(err)
    }
  }
}

module.exports = Ledger

// Events

// 'ledger:device:added'
//   -  { address }
// 'ledger:device:removed'
//   -  id
// 'ledger:device:changed'
//   -  { address }
