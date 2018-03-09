const { ipcRenderer } = require('electron')
const uuid = require('uuid/v4')
const Web3 = require('web3')
// const getHost = _ => (new URL(window.location.href)).host.replace(/^(www\.)/, '')

const provider = require('./provider')
const handlers = {}

ipcRenderer.on('frame:requestProvider', (e, id, err, access) => {
  if (!handlers[id]) return
  handlers[id](err, access ? provider : null)
  delete handlers[id]
})

window.requestProvider = function requestProvider (cb, web3) {
  let id = uuid()
  ipcRenderer.sendToHost('dapp:requestProvider', id)
  handlers[id] = cb
}

window.requestProvider.Web3 = Web3
