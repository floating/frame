// Colect data about exchange rates and gas prices

const { powerMonitor } = require('electron')
const log = require('electron-log')
const WebSocket = require('ws')

let socket, reconnectTimer

const reconnect = now => {
  log.info('Trying to reconnect to realtime')
  clearTimeout(reconnectTimer)
  reconnectTimer = setInterval(() => setUpSocket('reconnectTimer'), now ? 0 : 15 * 1000)
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

const onOpen = () => {
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
