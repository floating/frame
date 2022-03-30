import log from 'electron-log'

import ethProvider from 'eth-provider'

log.transports.console.format = '[scanWorker] {h}:{i}:{s} {text}'
log.transports.console.level = process.env.LOG_WORKER ? 'debug' : 'info'
log.transports.file.level = ['development', 'test'].includes(process.env.NODE_ENV) ? false : 'verbose'

import { supportsChain as chainSupportsScan } from '../../multicall'
import balancesLoader, { BalanceLoader } from '.'
import TokenLoader from '../inventory/tokens'

interface ExternalDataWorkerMessage {
  command: string,
  args: any[]
}

let heartbeat: NodeJS.Timeout
let balances: BalanceLoader

const tokenLoader = new TokenLoader()
const eth = ethProvider('frame', { name: 'scanWorker' })

eth.on('connect', async () => {
  tokenLoader.start()
  balances = balancesLoader(eth)

  sendToMainProcess({ type: 'ready' })
})

async function getChains () {
  try {
    const chains: string[] = await eth.request({ method: 'wallet_getChains' })
    return chains.map(chain => parseInt(chain))
  } catch (e) {
    log.error('could not load chains', e)
    return []
  }
}

function sendToMainProcess (data: any) {
  if (process.send) {
    return process.send(data)
  } else {
    log.error(`cannot send to main process! connected: ${process.connected}`)
  }
}

async function tokenBalanceScan (address: Address, tokensToOmit: Token[] = []) {
  try {
    // for chains that support multicall, we can attempt to load every token that we know about,
    // for all other chains we need to call each contract individually so don't scan every contract
    const chains = (await getChains()).filter(chainSupportsScan)
    const tokenLists = chains.map(chainId => tokenLoader.getTokens(chainId))
    const tokens = tokenLists.reduce((all, tokenList) => {
      return all.concat(
        tokenList.filter(token => tokensToOmit.every(t => t.chainId !== token.chainId || t.address !== token.address))
      )
    }, [] as Token[])

    const tokenBalances = (await balances.getTokenBalances(address, tokens))
      .filter(balance => parseInt(balance.balance) > 0)

    sendToMainProcess({ type: 'tokenBalances', address, balances: tokenBalances, source: 'scan' })
  } catch (e) {
    log.error('error scanning for token balances', e)
  }
}

async function fetchTokenBalances (address: Address, tokens: Token[]) {
  try {
    const tokenBalances = await balances.getTokenBalances(address, tokens)

    sendToMainProcess({ type: 'tokenBalances', address, balances: tokenBalances, source: 'known' })
  } catch (e) {
    log.error('error fetching token balances', e)
  }
}

async function chainBalanceScan (address: string) {
  try {
    const chains = await getChains()
    const chainBalances = await balances.getCurrencyBalances(address, chains)

    sendToMainProcess({ type: 'chainBalances', balances: chainBalances, address })
  } catch (e) {
    log.error('error scanning chain balance', e)
  }
}

function resetHeartbeat () {
  clearTimeout(heartbeat)

  heartbeat = setTimeout(() => {
    log.warn('no heartbeat received in 60 seconds, worker exiting')
    process.kill(process.pid, 'SIGHUP')
  }, 60 * 1000)
}

const messageHandler: { [command: string]: (...params: any) => void } = {
  updateChainBalance: chainBalanceScan,
  fetchTokenBalances: fetchTokenBalances,
  tokenBalanceScan: tokenBalanceScan,
  heartbeat: resetHeartbeat
}

process.on('message', (message: ExternalDataWorkerMessage) => {
  log.debug(`received message: ${message.command} [${message.args}]`)

  const args = message.args || []
  messageHandler[message.command](...args)
})
