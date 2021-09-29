import { EventEmitter } from 'stream'

import usb from 'usb'
import HID from 'node-hid'

export class SignerAdapter extends EventEmitter {
  name: string;

  constructor (name: string) {
    super() 

    this.name = name
  }

  open () {}
  close () {}

  supportsDevice (device: any) { 
    return false
  }

  handleAttachedDevice (device: any) {
    throw new Error(`attempted to attach device with no adapter: ${device.toString()}`)
  }

  handleDetachedDevice (device: any) {
    throw new Error(`attempted to detach device with no adapter: ${device.toString()}`)
  }
}

export class UsbSignerAdapter extends SignerAdapter {
  private attachListener: (device: usb.Device) => void;
  private detachListener: (device: usb.Device) => void;

  constructor (name: string) {
    super(name)

    this.attachListener = usbDevice => {
      if (this.supportsDevice(usbDevice)) {
        this.handleAttachedDevice(usbDevice)
      }
    }

    this.detachListener = usbDevice => {
      if (this.supportsDevice(usbDevice)) {
        this.handleDetachedDevice(usbDevice)
      }
    }

    usb.on('attach', this.attachListener)
    usb.on('detach', this.detachListener)
  }

  open () {
    const attachedDevices = usb.getDeviceList()

    attachedDevices.forEach(usbDevice => {
      if (this.supportsDevice(usbDevice)) {
        this.handleAttachedDevice(usbDevice)
      }
    })
  }

  close () {
    usb.removeListener('attach', this.attachListener)
    usb.removeListener('detach', this.detachListener)

    const attachedDevices = usb.getDeviceList()

    attachedDevices.forEach(usbDevice => {
      if (this.supportsDevice(usbDevice)) {
        this.handleDetachedDevice(usbDevice)
      }
    })

    super.close()
  }

  findHid (usbDevice: usb.Device) {
    return HID
      .devices(usbDevice.deviceDescriptor.idVendor, usbDevice.deviceDescriptor.idProduct)
  }

  deviceId (device: usb.Device) {
    return [
      device.busNumber,
      device.deviceAddress,
      device.deviceDescriptor.idProduct,
      device.deviceDescriptor.idVendor
    ].join(':')
  }

  supportsDevice (device: usb.Device) {
    return false
  }
}
