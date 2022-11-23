import { ipcRenderer } from 'electron'
import rpc from './rpc'

<<<<<<< HEAD
<<<<<<< HEAD
const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
=======
const unwrap = v => {
  // console.log(v)
  return v !== undefined || v !== null ? JSON.parse(v) : v
}
>>>>>>> 57acab1b (first pass at parcel serve + HMR)
=======
const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
>>>>>>> 9a4e8f89 (remove logs, add dev check)
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v
const source = 'bridge:link'
const safeOrigins = ['file://']

<<<<<<< HEAD
<<<<<<< HEAD
if (process.env.NODE_ENV === 'development' && process.env.HMR === 'true') {
  safeOrigins.push('http://localhost:1234')
}

window.addEventListener('message', e => {
  if (!safeOrigins.includes(e.origin)|| e.data.source?.includes('react-devtools')) return
  const data = unwrap(e.data)
  if (data.source !== source) {
    if (data.method === 'rpc') {
=======
if (process.env.HMR) {
=======
if (process.env.NODE_ENV === 'development' && process.env.HMR === 'true') {
>>>>>>> 9a4e8f89 (remove logs, add dev check)
  safeOrigins.push('http://localhost:1234')
}

window.addEventListener('message', e => {
  if (!safeOrigins.includes(e.origin)) return
  const data = unwrap(e.data)
  if (data.source !== source) {
    if (data.method === 'rpc') {
<<<<<<< HEAD
      // console.log('got rpc message')
>>>>>>> 57acab1b (first pass at parcel serve + HMR)
=======
>>>>>>> 9a4e8f89 (remove logs, add dev check)
      return rpc(...data.args, (...args) => e.source.postMessage(wrap({ method: 'rpc', id: data.id, args, source }), e.origin))
    }
    if (data.method === 'event') return ipcRenderer.send(...data.args)
    if (data.method === 'invoke') {
      (async () => {
        const args = await ipcRenderer.invoke(...data.args)
        window.postMessage(wrap({ method: 'invoke', channel: 'action', id: data.id, args, source }), '*')
      })()
    }
  }
}, false)

ipcRenderer.on('main:action', (...args) => {
  args.shift()
  window.postMessage(wrap({ method: 'event', channel: 'action', args, source }), '*')
})

ipcRenderer.on('main:flex', (...args) => {
  args.shift()
  window.postMessage(wrap({ method: 'event', channel: 'flex', args, source }), '*')
})

ipcRenderer.on('main:dapp', (...args) => {
  args.shift()
  window.postMessage(wrap({ method: 'event', channel: 'dapp', args, source }), '*')
})
