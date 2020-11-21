require('babel-polyfill')
const HID = require('node-hid')
const usb = require('usb')
const log = require('electron-log')
const Ledger = require('./Ledger')
// const isLedger = d => (['win32', 'darwin'].includes(process.platform) ? d.usagePage === 0xffa0 : d.interface === 0) && ((d.vendorId === 0x2581 && d.productId === 0x3b7c) || d.vendorId === 0x2c97)
const isLedger = d => ((d.vendorId === 0x2581 && d.productId === 0x3b7c) || d.vendorId === 0x2c97)

let scanTimer = null

module.exports = {
  scan: (signers) => {
    log.info('Ledger Scanner Started...')
    const scan = (followup = false) => {
      clearTimeout(scanTimer)
      const current = HID.devices().filter(isLedger)
      signers.list().forEach((signer, i) => {
        if (current.map(device => device.path).indexOf(signer.devicePath) === -1 && signer.type === 'ledger') {
          log.info('Removing Ledger: ', signer.id)
          signers.remove(signer.id)
        }
      })
      current.forEach(device => {
        let signer = signers.find(signer => signer.devicePath === device.path)
        const validInterface = d => ['win32', 'darwin'].includes(process.platform) ? d.usagePage === 0xffa0 : d.interface === 0
        if (validInterface(device)) {
          if (!signer) {
            log.info('Creating Ledger Signer: ...', device.path.substr(device.path.length - 5))
            signer = new Ledger(device.path, signers, scan)
            signers.add(signer)
          } else {
            signer.deviceStatus()
          }
          log.info('Updating Ledger: ', JSON.stringify(signer.summary()))
        }
      })
      if (followup) scanTimer = setTimeout(() => scan(), 800)
    }
    usb.on('attach', () => scan(true))
    usb.on('detach', () => scan(true))
    scan(true)
  }
}
