import log from 'electron-log'

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'
log.transports.console.level = process.env.LOG_WORKER ? 'debug' : 'info'

import * as balances from './balances'
import rates from './rates'
import inventory from './inventory'
import loadStaticData from './staticData'

function sendToMainProcess (data: any) {
  if (process.send) {
    return process.send(data)
  } else {
    log.error(`cannot send to main process! connected: ${process.connected}`)
  }
}

interface BalanceScanAddresses {
  [address: string]: {
    knownTokens: TokenDefinition[],
    onlyKnown: boolean
  }
}

interface ExternalDataWorkerMessage {
  command: string,
  args: any
}

let heartbeat: NodeJS.Timeout

function tokenBalanceScan (addresses: BalanceScanAddresses) {
  for (const address in addresses) {
    const { knownTokens, onlyKnown } = addresses[address]

    balances.getTokenBalances(address, { knownTokens, onlyKnown })
      .then(foundTokens => {
        sendToMainProcess({ type: 'tokenBalances', netId: foundTokens.chainId, address, balances: foundTokens.balances })
      })
      .catch(err => log.error('token scan error', err))
  }
}

function chainBalanceScan (address: string) {
  balances.getNativeCurrencyBalance(address)
    .then(balance => sendToMainProcess({ type: 'chainBalance', ...balance }))
    .catch(err => log.error('chain balance scan error', err))
}

function ratesScan (symbols: string[], chainId: number) {
  rates(symbols, chainId)
    .then(loadedRates => sendToMainProcess({ type: 'rates', rates: loadedRates }))
    .catch(err => log.error('rates scan error', err))
}

function nativeCurrencyScan (symbols: string[]) {
  loadStaticData(symbols)
    .then(currencyData => sendToMainProcess({ type: 'nativeCurrencyData', currencyData }))
    .catch(err => log.error('native currency scan error', err))
}

function inventoryScan (addresses: string[]) {
  addresses.forEach(address => {
    inventory(address)
      .then(inventory => sendToMainProcess({ type: 'inventory', address, inventory }))
      .catch(err => log.error('inventory scan error', err))
  })
}

function resetHeartbeat () {
  clearTimeout(heartbeat)

  heartbeat = setTimeout(() => {
    log.warn('no heartbeat received in 60 seconds, worker exiting')
    process.kill(process.pid, 'SIGHUP')
  }, 60 * 1000)
}

const messageHandler: { [command: string]: (...params: any) => void } = {
  updateRates: ratesScan,
  updateNativeCurrencyData: nativeCurrencyScan,
  updateChainBalance: chainBalanceScan,
  updateTokenBalances: tokenBalanceScan,
  updateInventory: inventoryScan,
  heartbeat: resetHeartbeat
}

process.on('message', (message: ExternalDataWorkerMessage) => {
  log.debug(`received message: ${message.command} [${message.args}]`)

  const args = message.args || []
  messageHandler[message.command](...args)
})
