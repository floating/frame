/* globals WebSocket */

const Web3 = require('web3')
const EventEmitter = require('events')
const uuid = require('uuid/v4')

const connect = (provider, url, reconnect = true) => {
  provider.handlers = {}
  if (!provider.socket || provider.socket.readyState > 1) {
    provider.socket = new WebSocket(url || 'ws://localhost:1248?mode=normal')
    provider.socket.addEventListener('open', () => {
      console.log('Frame Provider Connected!')
      reconnect = true
      provider.emit('open')
    })
    provider.socket.addEventListener('close', () => {
      console.log('Frame Provider Disconnected!')
      provider.socket = null
      if (reconnect) setTimeout(_ => connect(provider, url), 1000)
      provider.emit('close')
    })
    provider.socket.addEventListener('message', message => {
      message = JSON.parse(message.data)
      if (message.type === 'response' && provider.handlers[message.handlerId]) {
        provider.handlers[message.handlerId](message.err, message.res)
      } else {
        console.log('No handler for socket message in provider: ', message)
      }
    })
  }
}

const getProvider = (url, reconnect) => {
  const provider = new EventEmitter()
  connect(provider, url, reconnect)
  provider.sendAsync = (payload, cb) => {
    if (!provider.socket || provider.socket.readyState > 1) return cb(new Error('Provider Disconnected'))
    payload.handlerId = uuid()
    provider.handlers[payload.handlerId] = cb
    provider.socket.send(JSON.stringify(payload))
  }
  return provider
}

try {
  let url = 'ws://localhost:1248?mode=normal'
  let reconnect = true
  window.frame = window.frame || {initialConnect: true}
  if (window.frame.initialConnect) {
    window.frame.initialConnect = false
    url = 'ws://localhost:1248?mode=quiet'
    reconnect = false
  }
  window.frame.provider = getProvider(url, reconnect)
  window.web3 = new Web3(window.frame.provider)
} catch (e) {
  console.error('Frame Error:', e)
}
