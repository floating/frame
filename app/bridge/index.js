import { ipcRenderer, webFrame } from 'electron'
import state from '../../state'
import rpc from './rpc'

// const _setImmediate = setImmediate
// process.once('loaded', () => { global.setImmediate = _setImmediate })
webFrame.executeJavaScript(`window.__initialState = ${JSON.stringify(state())}`)

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
