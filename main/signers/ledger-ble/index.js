const log = require('electron-log')

const flex = require('../../flex')

const Ledger = require('./Ledger')

module.exports = (signers, api) => {
  log.info(' ')
  log.info('Ledger BLE Scaner Started...')
  flex.on('ledger:scan:failed', err => {
    if (err) log.error(err)
    setTimeout(() => {
      flex.synthetic('ledger.scan', (err, res) => console.log(err, res))
    }, 5000)
  })
  // ipcMain.on('bluetooth-select-device', (devices) => {
  //   console.log('bluetooth-select-device')
  //   console.log(devices)
  // })
  const scan = () => {
    log.info('Ledger BLE Scan Started')
    flex.rpc('ledger.current', (err, current) => {
      if (err) return log.error(err)
      console.log('ledger.current')
      log.info('We found some BLE signers...', current)

      // Remove all signers no longer connected
      Object.keys(signers).forEach(id => {
        if (signers.type === 'LedgerBLE' && !current[id]) {
          log.info('Removing BLE Ledger: ', id)
          signers[id].close()
          delete signers[id]
        }
      })
      // Add all newly added signers
      Object.keys(current).forEach(id => {
        if (signers[id]) {
          signers[id].deviceStatus()
          return log.info('Updating Ledger: ', id)
        }
        let ledger
        log.info('Adding New Ledger: ', id)
        try {
          ledger = new Ledger(current[id], api)
        } catch (e) {
          return log.error(e)
        }
        log.info('  > Ledger Created: ', id)
        signers[id] = ledger
      })
      log.info(' ')
    })
  }

  // Do initial pair in chome and then use noble?

  flex.on('ready', () => {
    flex.synthetic('ledger.scan', (err, res) => console.log(err, res))
    flex.on('ledger:device:added', scan)
    flex.on('ledger:device:removed', scan)
    scan()
  })
}
