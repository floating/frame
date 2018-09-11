const HID = require('node-hid')
const usbDetect = require('usb-detection')
const log = require('electron-log')
const uuid = require('uuid/v5')
const Ledger = require('./Ledger')
const isLedger = d => (['win32', 'darwin'].includes(process.platform) ? d.usagePage === 0xffa0 : d.interface === 0) && ((d.vendorId === 0x2581 && d.productId === 0x3b7c) || d.vendorId === 0x2c97)
const ns = '3bbcee75-cecc-5b56-8031-b6641c1ed1f1'

module.exports = signers => {
  log.info(' ')
  log.info('Ledger Scaner Started...')
  const scan = () => {
    log.info(' ')
    log.info('Ledger Scan Triggered:')
    let current = HID.devices().filter(isLedger)
    log.info('  > Currently Connected Ledgers: ', current.map(device => uuid('Ledger' + device.path, ns)))
    log.info('  > Already Created Ledgers: ', Object.keys(signers).filter(id => signers[id].type === 'Ledger'))
    log.info(' ')
    Object.keys(signers).forEach(id => {
      if (current.map(device => uuid('Ledger' + device.path, ns)).indexOf(id) === -1 && signers[id].type === 'Ledger') {
        log.info('Removing Ledger: ', id)
        signers[id].close()
        delete signers[id]
      }
    })
    current.forEach(device => {
      let id = uuid('Ledger' + device.path, ns)
      if (signers[id]) {
        signers[id].deviceStatus()
        return log.info('Updating Ledger: ', id)
      }
      let ledger
      log.info('Adding New Ledger: ', id)
      try {
        ledger = new Ledger(id, device.path)
      } catch (e) {
        return log.error(e)
      }
      log.info('  > Ledger Created: ', id)
      signers[id] = ledger
    })
    log.info(' ')
  }
  usbDetect.on('change', () => setTimeout(scan, 10))
  usbDetect.startMonitoring()
  scan()
}
