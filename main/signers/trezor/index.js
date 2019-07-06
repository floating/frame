require('babel-polyfill')

const TrezorJS = require('trezor.js')
const Trezor = require('./Trezor')
const messages = require('./messages.json')
const config = JSON.stringify(messages)

module.exports = {
  scan: (signers, api) => {
    const devices = new TrezorJS.DeviceList()
    devices.on('connect', device => {
      signers.add(new Trezor(device, api))
    })
    devices.on('disconnect', device => {
      // console.log('device')
      // console.log(device.originalDescriptor)
      console.log('device.originalDescriptor.path')
      console.log(device.originalDescriptor.path)
      let found = signers.list().find(signer => {
        if (signer && signer.device && signer.device.originalDescriptor && signer.device.originalDescriptor.path) {
          console.log('signer.device.originalDescriptor.path')
          console.log(signer.device.originalDescriptor.path)
          return device.originalDescriptor.path === signer.device.originalDescriptor.path
        } else {
          return false
        }
      })
      console.log('found')
      console.log(found)
      // let found = signers.list().find(signer => {
      //   console.log(device.originalDescriptor)
      //   console.log(signer.device)
      //   return device.originalDescriptor.path === signer.device.originalDescriptor.path
      // })
      if (found) signers.remove(found.id)
      // if (current.map(device => device.path).indexOf(signer.devicePath) === -1 && signer.type === 'ledger') {
      //   log.info('Removing Ledger: ', signer.id)
      //   signers.remove(signer.id)
      // }
      // signers.remove(signer.id)
      // signers[device.originalDescriptor.path].close()
      // delete signers[device.originalDescriptor.path]
    })
    devices.on('error', error => console.error('Trezor Error:', error))
    process.on('exit', () => devices.onbeforeunload())
  }
}
