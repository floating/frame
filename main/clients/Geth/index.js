const EthereumClient = require('../EthereumClient')
const store = require('../../store')

class Geth extends EthereumClient {
  constructor (options) {
    super('geth', options)

    // On ready -> start client
    this.on('ready', () => {
      // Get client mode and current network id
      const mode = store('main.clients.geth.mode')
      const networkId = store('main.connection.network')
      const networkFlag = this._getNetworkFlag(networkId)

      // Prepare client arguments
      let args = ['--networkid', networkId, '--syncmode', mode, '--nousb', '--rpc', '--rpcapi', 'admin,eth,net']
      if (networkFlag) args.push(networkFlag)

      // Start client
      this.run(args)
    })
  }

  _getNetworkFlag (networkId) {
    if (networkId === '3') return '--testnet'
    if (networkId === '4') return '--rinkeby'
    else return null
  }
}

module.exports = new Geth()
