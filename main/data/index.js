// Colect data about exchange rates and gas prices

const { powerMonitor } = require('electron')
const log = require('electron-log')
const WebSocket = require('ws')
const { BN, stripHexPrefix } = require('ethereumjs-util')

const store = require('../store')
const accounts = require('../accounts')

let socket, reconnectTimer

const hexToBn = hex => new BN(stripHexPrefix(hex), 'hex')
const gweiToWei = num => new BN(num).mul(ONE_GWEI).toString('hex')

const ONE_GWEI = hexToBn('0x3b9aca00')

function customGasLevel (chainId, network = 'ethereum') {
  return store('main.networksMeta', network, chainId, 'gas.price.levels.custom')
}

const reconnect = now => {
  log.info('Trying to reconnect to realtime')
  clearTimeout(reconnectTimer)
  reconnectTimer = setInterval(() => setUpSocket('reconnectTimer'), now ? 0 : 15 * 1000)
}

let staleTimer

const onData = data => {
  try {
    data = JSON.parse(data)
    if (data.status === 'ok' && data.mainnet && data.mainnet.gas) {
      const { slow, standard, fast, asap, ...gasTimes } = data.mainnet.gas

      const gas = {
        ...gasTimes,
        slow: '0x' + gweiToWei(slow),
        standard: '0x' + gweiToWei(standard),
        fast: '0x' + gweiToWei(fast),
        asap: '0x' + gweiToWei(asap),
        custom: customGasLevel(1) || '0x' + gweiToWei(standard),
      }

      clearTimeout(staleTimer)
      // If we havent recieved gas data in 90s, make sure we're connected
      staleTimer = setTimeout(() => setUpSocket('staleTimer'), 90 * 1000)

      store.setGasPrices('ethereum', '1', gas)

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
