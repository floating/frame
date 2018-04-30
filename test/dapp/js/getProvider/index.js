/* globals WebSocket */

const EventEmitter = require('events')
const uuid = require('uuid/v4')

const connect = (provider, url) => {
  provider.handlers = {}
  if (!provider.socket || provider.socket.readyState > 1) {
    provider.socket = new WebSocket(url || 'ws://localhost:1248')
    provider.socket.addEventListener('open', () => provider.emit('open'))
    provider.socket.addEventListener('close', () => {
      provider.socket = null
      setTimeout(_ => connect(provider, url), 1000)
      provider.emit('close')
    })
    // provider.socket.addEventListener('error', err => provider.emit('error', err))
    provider.socket.addEventListener('message', message => {
      message = JSON.parse(message.data)
      if (message.type === 'response' && provider.handlers[message.handlerId]) {
        provider.handlers[message.handlerId](message.err, message.res)
      } else if (message.type === 'subscription') {
        provider.emit('data', message.payload)
      } else {
        console.log('No handler for socket message in provider: ', message)
      }
    })
  }
}

const getProvider = url => {
  const provider = new EventEmitter()
  connect(provider, url)
  provider.sendAsync = (payload, cb) => {
    if (!provider.socket || provider.socket.readyState > 1) return cb(new Error('Provider Disconnected'))
    payload.handlerId = uuid()
    provider.handlers[payload.handlerId] = cb
    provider.socket.send(JSON.stringify(payload))
  }
  return provider
}

module.exports = url => window.getProvider ? window.getProvider(url) : getProvider(url)
