// Colect data about exchange rates and gas prices

const { powerMonitor } = require('electron')
const log = require('electron-log')
const WebSocket = require('ws')

const store = require('../store')
const accounts = require('../accounts')

let socket, reconnectTimer

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
      store.setGasPrices('ethereum', '1', {
        slow: ('0x' + gweiToWei(Math.round(gas.slow)).toString(16)),
        slowTime: gas.slowTime,
        standard: ('0x' + gweiToWei(Math.round(gas.standard)).toString(16)),
        standardTime: gas.standardTime,
        fast: ('0x' + gweiToWei(Math.round(gas.fast)).toString(16)),
        fastTime: gas.fastTime,
        asap: ('0x' + gweiToWei(Math.round(gas.asap)).toString(16)),
        asapTime: gas.asapTime,
        custom: store('main.networks.ethereum.1.gas.price.levels.custom') || ('0x' + gweiToWei(Math.round(gas.standard)).toString(16)),
        lastUpdate: gas.lastUpdate,
        quality: gas.quality,
        source: gas.source
      })
      accounts.checkBetterGasPrice()
    }
  } catch (e) {
    log.error('Frame Socket Data Error: ', e)
    reconnect(true)
  }
}

const onClose = () => {
  log.info('gasSocket Disconnect')
  socket = null
  reconnect(true)
}

const onError = e => {
  console.log('gasSocket error', e)
  clearTimeout(reconnectTimer)
  reconnectTimer = setInterval(() => setUpSocket('reconnectTimer -- onError'), 15 * 1000)
}

const onOpen = e => log.info('Connected to realtime')

const setUpSocket = (reason) => {
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
