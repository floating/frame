const HID = require('node-hid')
const usbDetect = require('usb-detection')
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default
const Eth = require('@ledgerhq/hw-app-eth').default

const Ledger = require('./Ledger')

module.exports = signers => {
  const remove = id => {
    signers[id].close()
    delete signers[id]
  }
  const scan = _ => {
    let current = HID.devices().filter(device => device.vendorId === 11415 && device.productId === 1)
    Object.keys(signers).forEach(id => {
      if (current.map(device => device.path).indexOf(id) === -1 && signers[id].type === 'Nano S') remove(id)
    })
    current.forEach(device => {
      if (Object.keys(signers).indexOf(device.path) === -1 && device.product === 'Nano S') {
        let ledger
        try {
          ledger = new Ledger(device.path, new Eth(new TransportNodeHid(new HID.HID(device.path))), remove)
        } catch (e) {
          return console.log(e)
        }
        signers[device.path] = ledger
      }
    })
  }
  usbDetect.on('change', scan)
  usbDetect.startMonitoring()
  scan()
}
