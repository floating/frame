const fs = require('fs')
const windows = require('../../windows')
const store = require('../../store')
const EthereumClient = require('../EthereumClient')

class Parity extends EthereumClient {
  constructor (options) {
    super('parity', options)

    // On ready -> start client
    this.on('ready', () => {
      // Get client mode and current network id
      const networkId = store('main.connection.network')
      const chain = this._getChain(networkId)

      // Make sure parity is executable
      fs.chmodSync(this.bin, 755)

      // Prepare client arguments
      let args = ['--chain', chain, '--light']

      // Define error handler
      const errorHandler = (err) => {
        if (err.message.includes('Failed to open database')) {
          windows.broadcast('main:action', 'notify', 'parityAlreadyRunning')
        } else {
          console.log('\nUnhandled Parity error')
          console.error(err)
        }
      }

      // Start client
      this.run(args, errorHandler)
    })
  }

  _getChain (networkId) {
    if (networkId === '1') return 'mainnet'
    if (networkId === '3') return 'ropsten'
    if (networkId === '42') return 'kovan'
  }
}

module.exports = new Parity()
