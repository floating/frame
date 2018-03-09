const EventEmitter = require('events')
const { ipcRenderer } = require('electron')
const uuid = require('uuid/v4')

const events = new EventEmitter()
events.setMaxListeners(1000)

const handlers = {}

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v
const wrap = v => v !== undefined || v !== null ? JSON.stringify(v) : v

ipcRenderer.on('frame:provider', (e, id, err, res) => {
  id = unwrap(id)
  if (id && handlers[id]) {
    handlers[id](wrap(err), wrap(res))
    delete handlers[id]
  }
})

events.sendAsync = (payload, cb) => {
  let id = uuid()
  if (cb) handlers[id] = cb
  ipcRenderer.sendToHost('dapp:provider', id, JSON.stringify(payload))
}

module.exports = events
