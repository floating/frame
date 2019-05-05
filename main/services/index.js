const geth = require('./geth')
const ipfs = require('./ipfs')

module.exports = {
  stop: () => {
    geth.stop()
    ipfs.stop()
  },
  update: (name, on) => {
    console.log('services update ' + name + ' ' + on)
    if (name === 'eth') {
      if (on) {
        geth.start()
      } else {
        geth.stop()
      }
    } else if (name === 'ipfs') {
      if (on) {
        ipfs.start()
      } else {
        ipfs.stop()
      }
    }
  }
}
