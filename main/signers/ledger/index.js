const usbDetect = require('usb-detection')
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid').default
const Eth = require('@ledgerhq/hw-app-eth').default

const Ledger = require('./Ledger')

module.exports = signers => {
  let bounce
  const remove = path => {
    if (signers[path]) {
      signers[path].close()
      delete signers[path]
    }
  }
  const add = path => {
    TransportNodeHid.open(path).then(transport => {
      signers[path] = new Ledger(path, new Eth(transport))
    }).catch(e => remove(path))
  }
  const scan = _ => {
    TransportNodeHid.list().then(current => {
      Object.keys(signers).forEach(path => { if (current.indexOf(path) === -1 && signers[path].type === 'Nano S') remove(path) })
      current.forEach(add)
    })
  }
  TransportNodeHid.listen({next: e => {
    clearTimeout(bounce)
    bounce = setTimeout(scan, 200)
  }})
  usbDetect.on('change', () => {
    clearTimeout(bounce)
    bounce = setTimeout(scan, 200)
  })
  usbDetect.startMonitoring()
  bounce = setTimeout(scan, 200)
}
