// Colect data about exchange rates and gas prices

const { powerMonitor } = require('electron')
const log = require('electron-log')
const WebSocket = require('ws')

const store = require('../store')
const accounts = require('../accounts')
const chains = require('../chains')

let socket, reconnectTimer, gasTimer

const getCurrentChainGas = () => {
  const network = store('main.currentNetwork')
  chains.send({ id: 1, jsonrpc: '2.0', method: 'eth_gasPrice' }, response => {
    if (response.result) {
      // TODO: currently the minimum gasPrice supported is 1 gwei
      const price = Math.round(parseInt(response.result, 16) / 1000000000) || 1
      setGasPrices(network.type, network.id, {
        slow: price,
        standard: price,
        fast: price,
        asap: Math.round((price + 1) * 1.2),
        custom: store('main.networksMeta', network.type, network.id, 'gas.price.levels.custom') || response.result,
      })
    } else {
      setGasPrices(network.type, network.id, {
        slow: 0,
        standard: 0,
        fast: 0,
        asap: Math.round((price + 1) * 1.2),
        custom: store('main.networksMeta', network.type, network.id, 'gas.price.levels.custom') || 0,
      })
    }
  })
}

chains.on('connect', () => {
  store.observer(() => {
    clearTimeout(gasTimer)
    const network = store('main.currentNetwork')
    if (network.id === '1') return // mainnet gas prices use a websocket callback (see onData() below)
    getCurrentChainGas()
    gasTimer = setInterval(getCurrentChainGas, 10 * 1000)
  })
})

function setGasPrices (network, chainId, gas) {
  store.setGasPrices(network, chainId, {
    slow: ('0x' + gweiToWei(Math.round(gas.slow)).toString(16)),
    slowTime: gas.slowTime,
    standard: ('0x' + gweiToWei(Math.round(gas.standard)).toString(16)),
    standardTime: gas.standardTime,
    fast: ('0x' + gweiToWei(Math.round(gas.fast)).toString(16)),
    fastTime: gas.fastTime,
    asap: ('0x' + gweiToWei(Math.round(gas.asap)).toString(16)),
    asapTime: gas.asapTime,
    custom: store('main.networksMeta', network, chainId, 'gas.price.levels.custom') || ('0x' + gweiToWei(Math.round(gas.standard)).toString(16)),
    lastUpdate: gas.lastUpdate,
    quality: gas.quality,
    source: gas.source
  })
}

const reconnect = now => {
  log.info('Trying to reconnect to realtime')
  clearTimeout(reconnectTimer)
  reconnectTimer = setInterval(() => setUpSocket('reconnectTimer'), now ? 0 : 15 * 1000)
}

const gweiToWei = v => v * 1e9

let staleTimer

const onData = data => {
  try {
    data = JSON.parse(data)
    if (data.status === 'ok' && data.mainnet && data.mainnet.gas) {
      const { gas } = data.mainnet
      clearTimeout(staleTimer)
      // If we havent recieved gas data in 90s, make sure we're connected
      staleTimer = setTimeout(() => setUpSocket('staleTimer'), 90 * 1000)

      setGasPrices('ethereum', '1', gas)

      accounts.checkBetterGasPrice({type: 'ethereum', id: '1'})
    }
  } catch (e) {
    log.error('Frame Socket Data Error: ', e)
    reconnect(true)
  }
}

const onClose = (e) => {
  log.info('gasSocket Disconnect', e)
  reconnect()
}

const onError = e => {
  log.error('gasSocket error', e)
  clearTimeout(reconnectTimer)
  reconnectTimer = setInterval(() => setUpSocket('reconnectTimer -- onError'), 15 * 1000)
}

const onOpen = e => {
  log.info('Connected to realtime')
  clearTimeout(reconnectTimer)
}

const setUpSocket = (reason) => {
  log.info('setUpSocket', reason)
  try {
    clearTimeout(reconnectTimer)
    if (socket && socket.close) socket.close()
    socket = new WebSocket('wss://realtime.frame.sh')
    socket.on('open', onOpen)
    socket.on('message', onData)
    socket.on('close', onClose)
    socket.on('error', onError)
  } catch (e) {
    log.error(e)
    reconnect()
  }
}

module.exports = () => {
  setUpSocket('initial')
  powerMonitor.on('resume', () => setUpSocket('resume'))
  powerMonitor.on('unlock-screen', () => setUpSocket('unlock-screen'))
}
