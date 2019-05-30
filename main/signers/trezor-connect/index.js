require('babel-polyfill')

// const TrezorJS = require('trezor.js')
const Trezor = require('./Trezor')
// const EventEmitter = require('events')
const log = require('electron-log')
const flex = require('../../flex')

module.exports = (signers, api) => {
  console.log('helloo')
  flex.on('ready', () => {
    flex.on('trezor:connect', device => {
      console.log(':::: Trezor Scan :::: Connected Device', device)
      signers[device.path] = new Trezor(device, api)
    })
    flex.on('trezor:disconnect', device => {
      console.log(':::: Trezor Scan :::: Disconnected Device', device)
      signers[device.path].close()
      delete signers[device.path]
    })
    flex.on('trezor:update', device => {
      console.log(':::: Trezor Scan :::: Updated Device', device)
      signers[device.path].update(device)
    })
    flex.rpc('trezor.scan', err => {
      if (err) return log.error(err)
      console.log(':::: Trezor Scaner RPC Called :::: ')
    })
  })
  // const devices = new DeviceList()
  // devices.on('connect', device => {
  //   signers[device.path] = new Trezor(device, api)
  // })
  // devices.on('disconnect', device => {
  //   signers[device.path].close()
  //   delete signers[device.originalDescriptor.path]
  // })
  // devices.on('error', error => console.error('Trezor Error:', error))
  // process.on('exit', () => devices.close())
}
