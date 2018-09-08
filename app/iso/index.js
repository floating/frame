import uuid from 'uuid/v4'
import EventEmitter from 'events'

// const defined = value => value !== undefined || value !== null

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

const handlers = {}

const iso = new EventEmitter()
const source = 'view:iso'

iso.rpc = (...args) => {
  let cb = args.pop()
  if (typeof cb !== 'function') throw new Error('iso requires a callback')
  let id = uuid()
  handlers[id] = cb
  window.postMessage(wrap({id, args, source, method: 'rpc'}), '*')
}

iso.send = (...args) => window.postMessage(wrap({args, source, method: 'event'}), '*')

window.addEventListener('message', e => {
  let data = unwrap(e.data)
  if (e.origin === 'file://' && data.source !== source) {
    if (e.data.method === 'rpc') {
      let data = unwrap(e.data)
      let id = data.id
      let args = data.args || []
      let err = args.shift()
      err = err ? new Error(err) : err
      if (!handlers[id]) return console.log('Message from iso had no handler')
      handlers[id](err, ...args)
      delete handlers[id]
    } else if (data.method === 'event') {
      let channel = data.channel
      let args = data.args || []
      if (channel) iso.emit(channel, ...args)
    } else if (data.method === 'action') {
      iso.emit('action', ...data.args)
    }
  }
}, false)

iso.sync = (key, payload) => window.postMessage(wrap({key, payload, source, method: 'sync'}), '*')

export default iso
