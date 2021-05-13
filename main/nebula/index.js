const ethProvider = require('eth-provider')
const nebula = require('nebula')

const authToken = process.env.NEBULA_AUTH_TOKEN ? process.env.NEBULA_AUTH_TOKEN + '@' : ''
const pylonUrl = `https://${authToken}@ipfs.nebula.land`

// TODO: in the future we should use a cross chain provider, for now all ENS
// interaction will happen on the main chain
const ethNode = process.env.NODE_ENV === 'production'
  ? 'wss://mainnet.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'
  : 'wss://rinkeby.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'

module.exports = function (name) {
  return nebula(pylonUrl, ethProvider(ethNode, { name }))
}
