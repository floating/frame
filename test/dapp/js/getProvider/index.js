/* globals WebSocket */

const EventEmitter = require('events')
const uuid = require('uuid/v4')

module.exports = () => {
  let getProvider = () => {
    let socket
    let handlers = {}
    let connect = () => {
      if (!socket || socket.readyState > 1) {
        socket = new WebSocket('ws://localhost:1248')
        socket.addEventListener('open', () => {
          provider.emit('connect')
        })
        socket.addEventListener('close', () => {
          socket = null
          setTimeout(connect, 1000)
          provider.emit('disconnect')
        })
        socket.addEventListener('error', err => {
          provider.emit('error', err)
        })
        socket.addEventListener('message', message => {
          message = JSON.parse(message.data)
          if (message.type === 'response' && handlers[message.handlerId]) return handlers[message.handlerId](message.err, message.res)
          if (message.type === 'accounts') return provider.emit('accounts', message.accounts)
          console.log('No handler for socket message in requestProvider lib')
        })
      }
    }
    let provider = new EventEmitter()
    provider.sendAsync = (payload, cb) => {
      if (!socket) return cb(new Error('Disconnected from provider'))
      let id = uuid()
      handlers[id] = cb
      payload = Object.assign(payload, {handlerId: id})
      socket.send(JSON.stringify(payload))
    }
    connect()
    return provider
  }
  return window.getProvider ? window.getProvider() : getProvider()
}
