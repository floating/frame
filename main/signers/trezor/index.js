require('babel-polyfill')

const TrezorJS = require('trezor.js')
const Trezor = require('./Trezor')

module.exports = signers => {
  const devices = new TrezorJS.DeviceList()
  devices.on('connect', device => { signers[device.originalDescriptor.path] = new Trezor(device) })
  devices.on('disconnect', device => {
    signers[device.originalDescriptor.path].close()
    delete signers[device.originalDescriptor.path]
  })
  devices.on('error', error => console.error('Trezor Error:', error))
  process.on('exit', () => devices.onbeforeunload())
}
