const { ipcRenderer } = require('electron')
const uuid = require('uuid/v4')

const defined = value => value !== undefined || value !== null

const handlers = {}

ipcRenderer.on('main:rpc', (sender, id, ...args) => {
  if (!handlers[id]) return console.log('Message from main RPC had no handler.')
  args = args.map(arg => defined(arg) ? JSON.parse(arg) : arg)
  handlers[id](...args)
  delete handlers[id]
})

const rpc = (...args) => {
  let cb = args.pop()
  if (typeof cb !== 'function') throw new Error('Main RPC requires a callback.')
  let id = uuid()
  handlers[id] = cb
  args = args.map(arg => defined(arg) ? JSON.stringify(arg) : arg)
  ipcRenderer.send('main:rpc', JSON.stringify(id), ...args)
}

module.exports = rpc
