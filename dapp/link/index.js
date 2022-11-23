import { v4 as uuid } from 'uuid'
import EventEmitter from 'events'

const source = 'tray:link'

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

const handlers = {}

const link = new EventEmitter()
link.rpc = (...args) => {
  const cb = args.pop()
  if (typeof cb !== 'function') throw new Error('link.rpc requires a callback')
  const id = uuid()
  handlers[id] = cb
  window.postMessage(wrap({ id, args, source, method: 'rpc' }), '*')
}
link.send = (...args) => {
  window.postMessage(wrap({ args, source, method: 'event' }), '*')
}

const safeOrigins = ['file://']

<<<<<<< HEAD
if (process.env.NODE_ENV === 'development' && process.env.HMR === 'true') {
=======
if (process.env.HMR) {
>>>>>>> 57acab1b (first pass at parcel serve + HMR)
  safeOrigins.push('http://localhost:1234')
}

window.addEventListener('message', e => {
  if (!safeOrigins.includes(e.origin)) return
  const data = unwrap(e.data)
  const args = data.args || []
  if (data.source !== source) {
    if (data.method === 'rpc') {
      if (!handlers[data.id]) return console.log('link.rpc response had no handler')
      handlers[data.id](...args)
      delete handlers[data.id]
    } else if (data.method === 'event') {
      if (!data.channel) return console.log('link.on event had no channel')
      link.emit(data.channel, ...args)
    }
  }
}, false)

export default link
