// Colect data about exchange rates and gas prices

// const gasSync = async () => {
//   const response = await fetch('https://ethgasstation.info/api/ethgasAPI.json?api-key=603385e34e3f823a2bdb5ee2883e2b9e63282869438a4303a5e5b4b3f999')
//   const prices = await response.json()
//   store.setGasPrices('ethereum', '1', {
//     safelow: ('0x' + (prices.safeLow * 100000000).toString(16)),
//     standard: ('0x' + (prices.average * 100000000).toString(16)),
//     fast: ('0x' + (prices.fast * 100000000).toString(16)),
//     trader: ('0x' + (prices.fastest * 100000000).toString(16)),
//     custom: store('main.networks', network.type, network.id, 'gas.price.levels.custom') || ('0x' + (prices.average * 100000000).toString(16))
//   })
// }

// gasSync()
// setInterval(gasSync, 15 * 1000)
const { powerMonitor } = require('electron')
const log = require('electron-log')
const WebSocket = require('ws')

const store = require('../store')
const accounts = require('../accounts')

let socket, reconnectTimer, connected

const reconnect = now => {
  log.info('Trying to reconnect to realtime')
  clearTimeout(reconnectTimer)
  reconnectTimer = setInterval(() => setUpSocket('reconnectTimer'), now ? 0 : 15 * 1000)
}

// const onOpen = () => {
//   clearTimeout(reconnectTimer)
// }

// const weiToGwei = v => v / 1e9
const gweiToWei = v => v * 1e9

let staleTimer

const onData = data => {
  try {
    data = JSON.parse(data)
    if (data.status === 'ok' && data.mainnet && data.mainnet.gas) {
      const { gas } = data.mainnet
      clearTimeout(staleTimer)
      // If we havent recieved gas data in 60s, make sure we're connected
      staleTimer = setTimeout(() => setUpSocket('staleTimer'), 60 * 1000)
      store.setGasPrices('ethereum', '1', {
        slow: ('0x' + gweiToWei(gas.slow).toString(16)),
        slowTime: gas.slowTime,
        standard: ('0x' + gweiToWei(gas.standard).toString(16)),
        standardTime: gas.standardTime,
        fast: ('0x' + gweiToWei(gas.fast).toString(16)),
        fastTime: gas.fastTime,
        asap: ('0x' + gweiToWei(gas.asap).toString(16)),
        asapTime: gas.asapTime,
        custom: store('main.networks.ethereum.1.gas.price.levels.custom') || ('0x' + gweiToWei(gas.standard).toString(16)),
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
  reconnect()
}

const onError = e => {
  console.log('gasSocket error', e)
  clearTimeout(reconnectTimer)
  reconnectTimer = setInterval(() => setUpSocket('reconnectTimer -- onError'), 15 * 1000)
}

const setUpSocket = (reason) => {
  // console.log('setUpSocket', reason)
  try {
    clearTimeout(reconnectTimer)
    socket = new WebSocket('wss://realtime.frame.sh')
    socket.on('message', onData)
    // socket.on('open', onOpen)
    socket.on('close', onClose)
    socket.on('error', onError)
  } catch (e) {
    log.error(e)
    reconnect()
  }
}

setUpSocket('initial')
powerMonitor.on('resume', () => setUpSocket('resume'))
powerMonitor.on('unlock-screen', () => setUpSocket('unlock-screen'))
