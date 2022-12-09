import { ipcRenderer } from 'electron'
let i = 0
const newId = () => ++i

const defined = (value) => value !== undefined || value !== null

const handlers = {}

ipcRenderer.on('main:rpc', (sender, id, ...args) => {
  if (!handlers[id]) return console.log('Message from main RPC had no handler:', args)
  args = args.map((arg) => (defined(arg) ? JSON.parse(arg) : arg))
  handlers[id](...args)
  delete handlers[id]
})

export default (...args) => {
  const cb = args.pop()
  if (typeof cb !== 'function') throw new Error('Main RPC requires a callback')
  const id = newId()
  handlers[id] = cb
  args = args.map((arg) => (defined(arg) ? JSON.stringify(arg) : arg))
  ipcRenderer.send('main:rpc', JSON.stringify(id), ...args)
}
