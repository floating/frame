/* globals WebSocket, _storage */

window.ethereum = require('eth-provider')('frame')

let storage = _storage

const c = {}
document.cookie.split('; ').forEach(i => { c[i.split('=')[0]] = i.split('=')[1] })
const socket = new WebSocket(`ws://127.0.0.1:8421?hash=${c.__hash}&session=${c.__session}`)
let socketOpen = false
socket.addEventListener('open', e => { socketOpen = true })
socket.addEventListener('message', e => {
  try {
    const message = JSON.parse(e.data)
    if (message.type === 'localStorage') {
      storage = JSON.parse(message.state)
      window.dispatchEvent('storage')
    }
  } catch (e) {}
})
const updateStorage = () => {
  if (socketOpen) socket.send(JSON.stringify({ type: 'localStorage', state: JSON.stringify(storage) }))
}

window.localStorage.clear()

window.localStorage.length = Object.keys(storage).length

window.localStorage.getItem = key => {
  if (!key || !storage[escape(key)]) return null
  return unescape(storage[escape(key)])
}

window.localStorage.setItem = (key, value) => {
  if (!key) return null
  storage[escape(key)] = escape(value)
  window.localStorage.length = Object.keys(storage)
  updateStorage()
}

window.localStorage.removeItem = key => {
  if (!key) return null
  delete storage[escape(key)]
  window.localStorage.length = Object.keys(storage)
  updateStorage()
}

window.localStorage.clear = () => {
  storage = {}
  window.localStorage.length = Object.keys(storage)
  updateStorage()
}

window.localStorage.hasOwnProperty = key => {
  return Boolean(storage[escape(key)])
}

const domain = (new URLSearchParams(window.location.search)).get('app')
window.history.replaceState({}, document.title, `/${domain}`)

const currentScript = document.currentScript || document.scripts[document.scripts.length - 1]
currentScript.parentNode.removeChild(currentScript)
