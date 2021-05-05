const log = require('electron-log')
const store = require('../../store')
const LatticeDevice = require('./Lattice')

module.exports = {
  scan: (signers) => {
    store.observer(() => {
      const lattice = store('main.lattice') || {}
      Object.keys(lattice).forEach(async deviceId => {
        if (!deviceId) return
        log.info('Found a Lattice that isn\'t a signer, deviceId ', deviceId)
        if (store('main.signers', deviceId)) return console.log('signer already exists', store('main.signers', deviceId))
        const signer = new LatticeDevice(deviceId, signers)
        signers.add(signer)
      })
    })
  }
}