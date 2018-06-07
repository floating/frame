const HID = require('node-hid')
const usbDetect = require('usb-detection')
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default
const Eth = require('@ledgerhq/hw-app-eth').default
const uuid = require('uuid/v5')
const Ledger = require('./Ledger')
const isLedger = d => (['win32', 'darwin'].includes(process.platform) ? d.usagePage === 0xffa0 : d.interface === 0) && ((d.vendorId === 0x2581 && d.productId === 0x3b7c) || d.vendorId === 0x2c97)
const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

module.exports = signers => {
  const scan = _ => {
    let current = HID.devices().filter(device => isLedger(device))
    Object.keys(signers).forEach(id => {
      if (current.map(device => uuid(device.path, ns)).indexOf(id) === -1 && signers[id].type === 'Nano S') {
        signers[id].close()
        delete signers[id]
      }
    })
    current.forEach(device => {
      let id = uuid(device.path, ns)
      if (Object.keys(signers).indexOf(id) === -1 && device.product === 'Nano S') {
        let ledger
        try {
          ledger = new Ledger(id, new Eth(new TransportNodeHid(new HID.HID(device.path))))
        } catch (e) {
          return console.log(e)
        }
        signers[id] = ledger
      }
    })
  }
  usbDetect.on('change', scan)
  usbDetect.startMonitoring()
  scan()
}
