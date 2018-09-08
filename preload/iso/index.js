import { ipcRenderer } from 'electron'
import rpc from '../rpc'
import store from '../store'

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

const source = 'preload:iso'

const iso = {
  action: (...args) => {
    window.postMessage(wrap({args, source, method: 'action'}), '*')
  }
}

window.addEventListener('message', e => {
  let data = unwrap(e.data)
  if (e.origin === 'file://' && data.source !== source) {
    if (data.method === 'rpc') return rpc(...data.args, (...args) => e.source.postMessage(wrap({id: data.id, args, source, method: 'rpc'}), e.origin))
    if (data.method === 'event') return ipcRenderer.send(...data.args)
    if (data.method === 'sync') store.setSync(data.key, data.payload)
  }
}, false)

const forward = ['main:trayOpen', 'main:addSigner', 'main:removeSigner', 'main:updateSigner', 'main:setSigner']
forward.forEach(channel => ipcRenderer.on(channel, (...args) => {
  args.shift()
  window.postMessage(wrap({channel, args, source, method: 'event'}), '*')
}))

export default iso

// Forward this event to iso
// ipcRenderer.on('main:trayOpen', (sender, open) => {
//   store.trayOpen(open)
//   if (open) store.setSignerView('default')
// })
