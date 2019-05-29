import { ipcRenderer } from 'electron'
// import state from '../../state'
import rpc from './rpc'

const dev = process.env.NODE_ENV === 'development'
// const _setImmediate = setImmediate
// process.once('loaded', () => { global.setImmediate = _setImmediate })
// webFrame.executeJavaScript(`window.__initialState = ${JSON.stringify(state())}`)

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v
const source = 'bridge:link'

window.addEventListener('message', e => {
  let data = unwrap(e.data)
  if (e.origin === 'file://' && data.source !== source) {
    if (data.method === 'rpc') return rpc(...data.args, (...args) => e.source.postMessage(wrap({ id: data.id, args, source, method: 'rpc' }), e.origin))
    if (data.method === 'event') return ipcRenderer.send(...data.args)
  }
}, false)

ipcRenderer.on('main:action', (...args) => {
  args.shift()
  window.postMessage(wrap({ channel: 'action', args, source, method: 'event' }), '*')
})

ipcRenderer.on('main:flex', (...args) => {
  args.shift()
  window.postMessage(wrap({ channel: 'flex', args, source, method: 'event' }), '*')
})

if (dev) {
  let path = require('path')
  let watch = require('node-watch')
  watch(path.resolve(__dirname, '..', 'bundle'), { recursive: true }, (evt, name) => {
    if (name.indexOf('css') > -1) window.postMessage(wrap({ method: 'reload', type: 'css', target: name }), '*')
  })
}
