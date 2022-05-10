// delete the Electron version while requiring Nebula. this allows ipfs-utils to use
// node-fetch instead of electron-fetch
const electron = process.versions.electron

// @ts-ignore
delete process.versions.electron

import nebula from 'nebula'

// @ts-ignore
process.versions.electron = electron

// @ts-ignore
import EthereumProvider from 'ethereum-provider'
import proxyConnection from '../provider/proxy'

const authToken = process.env.NEBULA_AUTH_TOKEN ? process.env.NEBULA_AUTH_TOKEN + '@' : ''
const pylonUrl = `https://${authToken}@ipfs.nebula.land`

// all ENS interaction happens on mainnet
export default function (connection = proxyConnection) {
  return nebula(pylonUrl, new EthereumProvider(connection))
}
