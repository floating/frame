const log = require('electron-log')
const store = require('../../store')
const LatticeDevice = require('./Lattice')

module.exports = {
  scan: (signers) => {
    store.observer(() => {
      const lattice = store('main.lattice') || {}
      Object.keys(lattice).forEach(async deviceId => {
        if (!deviceId || store('main.signers', 'lattice-' + deviceId)) return
        log.info('Found a Lattice that isn\'t a signer, deviceId ', deviceId)
        const signer = new LatticeDevice(deviceId, signers)
        signers.add(signer)
      })
    })
  }
}