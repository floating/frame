/* globals WebSocket */

const EventEmitter = require('events')
const uuid = require('uuid/v4')

module.exports = (store, cb) => {
  let called = false
  if (window.requestProvider) {
    window.requestProvider(cb)
  } else {
    let handlers = {}
    let socket = new WebSocket('ws://localhost:1248')
    let provider = new EventEmitter()
    provider.sendAsync = (payload, cb) => {
      let id = uuid()
      handlers[id] = cb
      payload = Object.assign(payload, {handlerId: id})
      socket.send(JSON.stringify(payload))
    }
    socket.addEventListener('message', message => {
      message = JSON.parse(message.data)
      if (message.type === 'response' && handlers[message.handlerId]) return handlers[message.handlerId](message.err, message.res)
      console.log('No handler for socket message in requestProvider lib')
    })
    socket.addEventListener('open', _ => {
      store.ws(true)
      if (!called) cb(null, provider)
      called = true
    })
    socket.addEventListener('close', e => {
      store.ws(false)
      if (!called) cb(e)
      called = true
    })
    socket.addEventListener('error', e => {
      e.preventDefault()
      if (!called) cb(e, provider)
      called = true
    })
  }
}
