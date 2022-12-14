// delete the Electron version while requiring Nebula. this allows ipfs-utils to use
// node-fetch instead of electron-fetch
const electron = process.versions.electron

// @ts-ignore
delete process.versions.electron

import nebula from 'nebula'

// @ts-ignore
process.versions.electron = electron

import EthereumProvider from 'ethereum-provider'
import proxyConnection from '../provider/proxy'
import { EventEmitter } from 'stream'

const authToken = process.env.NEBULA_AUTH_TOKEN ? process.env.NEBULA_AUTH_TOKEN + '@' : ''
const pylonUrl = `https://${authToken}@ipfs.nebula.land`

// all ENS interaction happens on mainnet
const mainnetProvider = new EthereumProvider(proxyConnection)
mainnetProvider.setChain(1)

export default function (provider = mainnetProvider) {
  let ready = false
  const events = new EventEmitter()

  provider.on('connect', () => {
    ready = true
    events.emit('ready')
  })

  return {
    once: events.once.bind(events),
    ready: () => ready,
    ...nebula(pylonUrl, provider),
    close: () => {
      provider.close()
    }
  }
}
