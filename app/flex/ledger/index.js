import 'babel-polyfill'

// Libraries
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble'
import AppEth from '@ledgerhq/hw-app-eth'
import EthereumTx from 'ethereumjs-tx'

class Device {
  constructor(device, emit) {
    this.device = device
    this.id = this.device.id
    this.eth = new AppEth(device)
    this.emit = emit
    this.setup()
  }

  setup() {
    this.connect()
  }

  summary() {
    return {
      id: this.id,
    }
  }

  connect() {
    this.emit('ledger:connect', this.summary())
  }

  disconnect() {
    this.emit('ledger:disconnect', this.summary())
  }

  update(device = this.device) {
    this.device = device
    this.emit('ledger:update', this.summary())
  }

  async ethereumGetAddress(path, display, cb) {
    try {
      cb(null, await this.eth.getAddress(path, display, true))
    } catch (err) {
      cb(err.message)
    }
  }

  ethereumSignTransaction(path, rawTx, cb) {
    const tx = new EthereumTx(rawTx)
    tx.raw[6] = Buffer.from([rawTx.chainId]) // v
    tx.raw[7] = Buffer.from([]) // r
    tx.raw[8] = Buffer.from([]) // s
    const rawTxHex = tx.serialize().toString('hex')
    this.eth
      .signTransaction(this.getPath(), rawTxHex)
      .then((result) => {
        cb(null, result)
      })
      .catch((err) => {
        cb(err.message)
      })
  }

  ethereumSignMessage(path, message, cb) {
    console.log('ethereumSignMessage')
  }

  ethereumVerifyMessage(path, message, cb) {
    console.log('ethereumVerifyMessage')
  }
}

class Ledger {
  constructor(emit) {
    this.emit = emit
    this.devices = {}
    document.addEventListener('mousedown', (e) => {
      // Synthetic input event created by main process for web-ble scan
      if (e.clientX === -124816 && e.clientX === -124816) this.scan()
    })
    this.emit('ledger:scan') // Request synthetic input
    this.scanner = setInterval(() => this.emit('ledger:scan'), 20000)
  }

  async scan() {
    try {
      const device = await TransportWebBLE.create()
      if (!this.devices[device.id]) {
        this.devices[device.id] = new Device(device, this.emit)
        device.on('disconnect', () => {
          this.devices[device.id].disconnect()
          delete this.devices[device.id]
          // remove list
          this.emit('ledger:scan') // Request scan
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  deviceNotFound(id, cb) {
    cb(new Error(`Device with id: ${id} not found`))
  }

  ethereumGetAddress(id, path, display, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumGetAddress(path, display, cb)
  }

  ethereumSignTransaction(id, path, tx, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumSignTransaction(path, tx, cb)
  }

  ethereumSignMessage(id, path, message, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumSignMessage(path, message, cb)
  }

  ethereumVerifyMessage(id, path, message, cb) {
    if (!this.devices[id]) return this.deviceNotFound(id, cb)
    this.devices[id].ethereumVerifyMessage(path, message, cb)
  }
}

module.exports = Ledger

// class Ledger {
//   constructor (emit) {
//     this.emit = emit
//     this.signers = {}
//   }
//   current (cb) {
//     // Return current signer summaries
//     let s = {}
//     Object.keys(this.signers).map(id => { s[id] = this.summary(id) })
//     cb(null, s)
//   }
//   summary (id) {
//     return {
//       id: this.signers[id].id,
//       status: this.signers[id].status,
//       statusMessage: this.signers[id].statusMessage,
//       publicKey: this.signers[id].publicKey,
//       address: this.signers[id].address,
//       chainId: this.signers[id].chainId
//     }
//   }
//   async getAddress (id, path, verify, chainId, cb) {
//     console.log(id, path, verify, chainId, cb)
//     try {
//       // const transport = await TransportWebBLE.create()
//       const eth = new AppEth(this.signers[id].transport)
//       cb(null, await eth.getAddress(path, false, true))
//       // transport.close()
//     } catch (err) {
//       cb(err)
//     }
//   }
//   update (id) {
//     this.emit('ledger:device:update', this.summary(id))
//   }
//   async getDeviceInfo (id) {
//     const eth = new AppEth(this.signers[id].transport)
//     const path = `44'/60'/0'/0/0` // HD derivation path
//     const result = await eth.getAddress(path, false, true)
//     this.signers[id].publicKey = result.publicKey
//     this.signers[id].address = result.address
//     this.signers[id].chainId = result.chainId
//     this.signers[id].status = 'ready'
//     this.signers[id].statusMessage = ''
//     this.emit('ledger:device:added', this.summary(id))
//     this.update(id)
//   }
//   async addDevice (transport) {
//     let id = transport.device.id
//     this.signers[id] = { id, transport, status: 'pending' }
//     this.emit('ledger:device:added', this.summary(id))
//     try {
//       this.getDeviceInfo(id)
//     } catch (err) {
//       this.signers[id].status = 'error'
//       this.signers[id].statusMessage = err.message
//       this.update(id)
//     }
//   }
//   async getTransport () {
//
//   }
//   async scan () {
//     let cancled = false
//     const error = err => {
//       cancled = true
//       this.emit('ledger:scan:failed', err)
//     }
//     try {
//       const timer = setTimeout(() => {
//         if (cancled) return
//         error(new Error('Time limit reached...'))
//       }, 20000)
//       const transport = await TransportWebBLE.create()
//       if (cancled) return
//       clearTimeout(timer)
//       this.addDevice(transport)
//     } catch (err) {
//       error(err)
//     }
//   }
// }
//
// module.exports = Ledger

// Events

// 'ledger:device:added'
//   -  { address }
// 'ledger:device:removed'
//   -  id
// 'ledger:device:changed'
//   -  { address }
