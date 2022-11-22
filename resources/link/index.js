import { v4 } from 'uuid'
import EventEmitter from 'events'

const source = 'tray:link'

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

const handlers = {}

const link = new EventEmitter()
link.rpc = (...args) => {
  const cb = args.pop()
  if (typeof cb !== 'function') throw new Error('link.rpc requires a callback')
  const id = v4()
  handlers[id] = cb
  window.postMessage(wrap({ id, args, source, method: 'rpc' }), '*')
}
link.send = (...args) => {
  window.postMessage(wrap({ args, source, method: 'event' }), '*')
}
link.invoke = (...args) => {
  return new Promise((resolve, reject) => {
    const id = v4()
    handlers[id] = resolve
    window.postMessage(wrap({ id, args, source, method: 'invoke' }), '*')
  })
}

window.addEventListener('message', e => {
  if (e.origin !== 'file://') return
  const data = unwrap(e.data)
  const args = data.args || []
  if (e.origin === 'file://' && data.source !== source) {
    if (data.method === 'rpc') {
      if (!handlers[data.id]) return console.log('link.rpc response had no handler')
      handlers[data.id](...args)
      delete handlers[data.id]
    } else if (data.method === 'invoke') {
      if (!handlers[data.id]) return console.log('link.invoke response had no handler')
      handlers[data.id](args)
      delete handlers[data.id]
    } else if (data.method === 'event') {
      if (!data.channel) return console.log('link.on event had no channel')
      link.emit(data.channel, ...args)
    } else if (data.method === 'reload' && data.type === 'css') {
      const correctTargetForWindow = new RegExp(`${window.document.title.toLowerCase()}\.[^\.]+\.css$`)
      if (!correctTargetForWindow.test(data.target)) {
        return
      }

      const sheets = document.querySelectorAll('link')
      const sheet = sheets[1]

      if (sheet.isLoaded === false || !sheet.href || !sheet.href.endsWith('.css')) {
        return
      }
      
      sheet.visited = true
      const clone = sheet.cloneNode()
      clone.isLoaded = false
      clone.addEventListener('load', () => {
        clone.isLoaded = true
        sheet.remove()
      })
      clone.addEventListener('error', () => {
        clone.isLoaded = true
        sheet.remove()
      })
      clone.href = data.target
      sheet.parentNode.appendChild(clone)
    }
  }
}, false)

export default link
