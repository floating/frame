require('babel-polyfill')
const log = require('electron-log')
const flex = require('../../flex')
const Trezor = require('./Trezor')

module.exports = {
  scan: (signers) => {
    flex.on('ready', () => {
      flex.on('trezor:connect', device => {
        log.info(':: Trezor Scan - Connected Device')
        const signer = new Trezor(device, signers)
        signers.add(signer)
      })
      flex.on('trezor:disconnect', device => {
        log.info(':: Trezor Scan - Disconnected Device')
        const signer = signers.find(signer => (signer.device && signer.device.path) === device.path)
        if (signer) signers.remove(signer.id)
      })
      flex.on('trezor:update', device => {
        log.info(':: Trezor Scan - Updated Device')
        const signer = signers.find(signer => (signer.device && signer.device.path) === device.path)
        if (signer) signer.update(device)
      })
      flex.on('trezor:needPin', device => {
        log.info(':: Trezor Scan - Device Needs Pin')
        const signer = signers.find(signer => (signer.device && signer.device.path) === device.path)
        if (signer) signer.needPin()
      })
      flex.on('trezor:needPhrase', device => {
        log.info(':: Trezor Scan - Device Needs Phrase')
        const signer = signers.find(signer => (signer.device && signer.device.path) === device.path)
        if (signer) signer.needPhrase()
      })
      flex.rpc('trezor.scan', err => { if (err) return log.error(err) })
    })
  }
}
