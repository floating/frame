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
    } else if (data.method === 'reload') {
      if (data.type === 'css') {
        document.querySelectorAll('link').forEach(sheet => {
          if (sheet.visited !== true && sheet.href.indexOf(data.target) > -1) {
            if (sheet.isLoaded === false || !sheet.href || !(sheet.href.indexOf('.css') > -1)) return
            sheet.visited = true
            let clone = sheet.cloneNode()
            clone.isLoaded = false
            clone.addEventListener('load', () => {
              clone.isLoaded = true
              sheet.remove()
            })
            clone.addEventListener('error', () => {
              clone.isLoaded = true
              sheet.remove()
            })
            clone.href = sheet.href
            sheet.parentNode.appendChild(clone)
          }
        })
      }
    }
  }
}, false)

export default link
