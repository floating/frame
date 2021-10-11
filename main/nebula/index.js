// delete the Electron version while requiring Nebula. this allows ipfs-utils to use
// node-fetch instead of electron-fetch
const electron = process.versions.electron
delete process.versions.electron

const nebula = require('nebula')
process.versions.electron = electron

const ethProvider = require('eth-provider')

const authToken = process.env.NEBULA_AUTH_TOKEN ? process.env.NEBULA_AUTH_TOKEN + '@' : ''
const pylonUrl = `https://${authToken}@ipfs.nebula.land`

// TODO: in the future we should use a cross chain provider, for now all ENS
// interaction will happen on the main chain

const ethNode = process.env.RINKEBY
  ? 'wss://rinkeby.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'
  : 'wss://mainnet.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'

module.exports = function (name) {
  return nebula(pylonUrl, ethProvider(ethNode, { name }))
}
