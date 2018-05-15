/* globals WebSocket */

const EventEmitter = require('events')

const connect = (provider, url) => {
  provider.reqCalllbacks = {}
  if (!provider.socket || provider.socket.readyState > 1) {
    provider.socket = new WebSocket(url || 'ws://localhost:1248')
    provider.socket.addEventListener('open', () => provider.emit('open'))
    provider.socket.addEventListener('close', () => {
      provider.socket = null
      setTimeout(_ => connect(provider, url), 500)
      provider.emit('close')
    })
    provider.socket.addEventListener('error', error => console.log('an error', error))
    provider.socket.addEventListener('message', message => {
      try { message = JSON.parse(message.data) } catch (e) { return console.warn(e) }
      if (!message.id && message.method && message.method.indexOf('_subscription') !== -1) {
        provider.emit('data', message)
      } else if (message.id) {
        if (provider.reqCalllbacks[message.id]) {
          provider.reqCalllbacks[message.id](message.error, message)
        } else {
          console.warn('No request callback for socket message in provider: ', message)
        }
      } else {
        console.warn('Unrecognized socket message in provider: ', message)
      }
    })
  }
}

const getProvider = url => {
  const provider = new EventEmitter()
  connect(provider, url)
  provider.sendAsync = (payload, cb) => {
    if (!provider.socket || provider.socket.readyState > 1) return cb(new Error('Provider Disconnected'))
    provider.reqCalllbacks[payload.id] = cb
    provider.socket.send(JSON.stringify(payload))
  }
  return provider
}

module.exports = url => window.getProvider ? window.getProvider(url) : getProvider(url)
