const store = require('../../store')
const LatticeDevice = require('./Lattice')

module.exports = {
  scan: (signers) => {
    // Look for all lattice signers stored in main... 
    store.observer(() => {
      console.log('LATTICE SCANNER')
      const lattice = store('main.lattice') || {}
      Object.keys(lattice).forEach(async deviceId => {
        if (!deviceId) return console.log('nodevice id', deviceId)
        console.log('FOUND A LATTICE that isn\'t a signer yet,  deviceID = ', deviceId)
        if (store('main.signers', deviceId)) return console.log('signer already exists', store('main.signers', deviceId))
        const signer = new LatticeDevice(deviceId, signers)
        signers.add(signer)

      })
    })
  }
}