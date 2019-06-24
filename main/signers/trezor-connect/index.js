require('babel-polyfill')
const log = require('electron-log')
const flex = require('../../flex')
const Trezor = require('./Trezor')

module.exports = {
  scan: (signers) => {
    const close = (device) => {
      if (signers[device.path]) signers[device.path].close()
      delete signers[device.path]
    }
    flex.on('ready', () => {
      flex.on('trezor:connect', device => {
        log.info(':: Trezor Scan - Connected Device')
        close(device)
        signers[device.path] = new Trezor(device, signers)
      })
      flex.on('trezor:disconnect', device => {
        log.info(':: Trezor Scan - Disconnected Device')
        close(device)
      })
      flex.on('trezor:update', device => {
        log.info(':: Trezor Scan - Updated Device')
        if (signers[device.path]) signers[device.path].update(device)
      })
      flex.on('trezor:needPin', device => {
        log.info(':: Trezor Scan - Device Needs Pin')
        if (signers[device.path]) signers[device.path].needPin()
      })
      flex.on('trezor:needPhrase', device => {
        log.info(':: Trezor Scan - Device Needs Phrase')
        if (signers[device.path]) signers[device.path].needPhrase()
      })
      flex.rpc('trezor.scan', err => { if (err) return log.error(err) })
    })
  }
}
