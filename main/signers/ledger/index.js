const HID = require('node-hid')
const usbDetect = require('usb-detection')
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default
const Eth = require('@ledgerhq/hw-app-eth').default

const Ledger = require('./Ledger')

module.exports = signers => {
  const scan = _ => {
    let current = HID.devices().filter(device => device.vendorId === 11415 && device.productId === 1)
    Object.keys(signers).forEach(path => {
      if (current.map(device => device.path).indexOf(path) === -1 && signers[path].type === 'Nano S') {
        signers[path].close()
        delete signers[path]
      }
    })
    current.forEach(device => {
      if (Object.keys(signers).indexOf(device.path) === -1 && device.product === 'Nano S') {
        let ledger
        try {
          ledger = new Ledger(device.path, new Eth(new TransportNodeHid(new HID.HID(device.path))))
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
