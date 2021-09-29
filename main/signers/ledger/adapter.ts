import usb from 'usb'
import HID from 'node-hid'
import log from 'electron-log'

import { UsbSignerAdapter } from '../adapter'

const supportedPlatforms = ['win32', 'darwin']

const supportedModels = [
  function isNanoX (device: usb.Device) {
    return (
      device.deviceDescriptor.idVendor === 0x2581 &&
      device.deviceDescriptor.idProduct === 0x3b7c
    )
  },
  function isNanoS (device: usb.Device) {
    return (
      device.deviceDescriptor.idVendor === 0x2c97 &&
      device.deviceDescriptor.idProduct === 0x1015
    )
  }
]

export default class LedgerSignerAdapter extends UsbSignerAdapter {
  constructor () {
    super('Ledger')
  }

  supportsDevice (usbDevice: usb.Device) {
    return supportedModels.some(checkSupport => checkSupport(usbDevice))

    // if (isLedger) {
    //   // need to get the actual USB connection to ensure this is the "eth app" 
    //   // device and not just the Ledger itself, which acts as a separate entity
    //   //console.log(HID
    //    // .devices(usbDevice.deviceDescriptor.idVendor, usbDevice.deviceDescriptor.idProduct))
      const hid = HID
        .devices(usbDevice.deviceDescriptor.idVendor, usbDevice.deviceDescriptor.idProduct)
        .find(device => device.interface === 0)

    //   const platformCheck = 
    //     !supportedPlatforms.includes(process.platform) ||
    //     hid?.usagePage === 0xffa0

    //   return !!hid && platformCheck
    // }

    // return false
  }
}