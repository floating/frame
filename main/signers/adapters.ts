import { EventEmitter } from 'stream'

import usb from 'usb'
import HID from 'node-hid'
import Signer from './signer'

function wait (ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export class SignerAdapter extends EventEmitter {
  adapterType: string;

  constructor (type: string) {
    super() 

    this.adapterType = type
  }

  open () {}
  close () {}
  reload (signer: Signer) { }
}

export class UsbSignerAdapter extends SignerAdapter {
  private attachListener: (device: usb.Device) => void;
  private detachListener: (device: usb.Device) => void;

  constructor (name: string) {
    super(name)

    this.attachListener = async usbDevice => {
      // it seems like the 'attach' event can be fired just before
      // the USB device is ready to be read from, 200ms seems to
      // always be enough time to wait
      // TODO: is there a low-level programmatic way to try to communicate
      // with the USB device and wait until its ready?
      await wait(200)

      if (this.supportsDevice(usbDevice)) {
        this.handleAttachedDevice(usbDevice)
      }
    }

    this.detachListener = usbDevice => {
      if (this.supportsDevice(usbDevice)) {
        this.handleDetachedDevice(usbDevice)
      }
    }
  }

  open () {
    usb.on('attach', this.attachListener)
    usb.on('detach', this.detachListener)

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

  handleAttachedDevice (device: any) {
    throw new Error(`attempted to attach device with no adapter: ${device.toString()}`)
  }

  handleDetachedDevice (device: any) {
    throw new Error(`attempted to detach device with no adapter: ${device.toString()}`)
  }
}
