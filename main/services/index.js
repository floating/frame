const geth = require('./geth')
const ipfs = require('./ipfs')
geth.start()
ipfs.start()

module.exports = {
  stop: () => {
    geth.stop()
    ipfs.stop()
  }
}
