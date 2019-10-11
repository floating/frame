window.ethereum = require('eth-provider')('frame')

const updateStorage = () => {
  const method = 'POST'
  const headers = { 'Content-Type': 'application/json' }
  const body = JSON.stringify(window.__storage__)
  window.fetch('/', { method, headers, body })
}

window.localStorage.clear()

window.localStorage.length = Object.keys(window.__storage__).length

window.localStorage.getItem = key => {
  if (!key || !window.__storage__[escape(key)]) return null
  return unescape(window.__storage__[escape(key)])
}

window.localStorage.setItem = (key, value) => {
  if (!key) return null
  window.__storage__[escape(key)] = escape(value)
  window.localStorage.length = Object.keys(window.__storage__)
  updateStorage()
}

window.localStorage.removeItem = key => {
  if (!key) return null
  delete window.__storage__[escape(key)]
  window.localStorage.length = Object.keys(window.__storage__)
  updateStorage()
}

window.localStorage.clear = () => {
  window.__storage__ = {}
  window.localStorage.length = Object.keys(window.__storage__)
  updateStorage()
}

window.localStorage.hasOwnProperty = key => {
  return Boolean(window.__storage__[escape(key)])
}

const currentScript = document.currentScript || document.scripts[document.scripts.length - 1]
currentScript.parentNode.removeChild(currentScript)
