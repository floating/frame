import uuid from 'uuid/v4'
import EventEmitter from 'events'

const source = 'tray:link'

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

const handlers = {}

const link = new EventEmitter()
link.rpc = (...args) => {
  let cb = args.pop()
  if (typeof cb !== 'function') throw new Error('link.rpc requires a callback')
  let id = uuid()
  handlers[id] = cb
  window.postMessage(wrap({ id, args, source, method: 'rpc' }), '*')
}
link.send = (...args) => window.postMessage(wrap({ args, source, method: 'event' }), '*')

window.addEventListener('message', e => {
  let data = unwrap(e.data)
  let args = data.args || []
  if (e.origin === 'file://' && data.source !== source) {
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
