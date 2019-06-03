const EthereumClient = require('../EthereumClient')
const store = require('../../store')
const fs = require('fs')

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

      // Start client
      this._run(args)
    })
  }

  _getChain (networkId) {
    if (networkId === '1') return 'mainnet'
    if (networkId === '3') return 'ropsten'
    if (networkId === '4') return 'rinkeby'
  }
}

module.exports = new Parity()
