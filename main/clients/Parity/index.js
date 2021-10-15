const fs = require('fs')
const log = require('electron-log')
const { app } = require('electron')

// Mock windows module if running tests
const windows = app ? require('../../windows') : { broadcast: () => {} }

const store = require('../../store')

const EthereumClient = require('../EthereumClient')

class Parity extends EthereumClient {
  constructor (options) {
    super('parity', options)

    // On ready -> start client
    this.on('ready', () => {
      // Get client mode and current network id
      const networkId = store('main.currentNetwork.id')
      const chain = this._getChain(networkId)

      // Make sure parity is executable
      fs.chmodSync(this.bin, 755)

      // Prepare client arguments
      const args = ['--chain', chain, '--light']

      // Define error handler
      const errorHandler = (err) => {
        if (err.message.includes('Failed to open database')) {
          windows.broadcast('main:action', 'notify', 'parityAlreadyRunning')
        } else {
          log.error('\nUnhandled Parity error')
          log.error(err)
        }
      }

      // Start client
      this.run(args, errorHandler)
    })
  }

  _getChain (networkId) {
    if (networkId === 1) return 'mainnet'
    if (networkId === 3) return 'ropsten'
    if (networkId === 42) return 'kovan'
  }
}

module.exports = new Parity()
