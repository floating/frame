// delete the Electron version while requiring Nebula. this allows ipfs-utils to use
// node-fetch instead of electron-fetch
const electron = process.versions.electron

// @ts-ignore
delete process.versions.electron

// @ts-ignore
import nebula from 'nebula'

// @ts-ignore
process.versions.electron = electron

import ethProvider from 'eth-provider'

const authToken = process.env.NEBULA_AUTH_TOKEN ? process.env.NEBULA_AUTH_TOKEN + '@' : ''
const pylonUrl = `https://${authToken}@ipfs.nebula.land`

// TODO: in the future we should use a cross chain provider, for now all ENS
// interaction will happen on the main chain

const ethNode = process.env.RINKEBY
  ? 'wss://rinkeby.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'
  : 'wss://mainnet.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'

export default function (name: string) {
  return nebula(pylonUrl, ethProvider(ethNode, { name }))
}
