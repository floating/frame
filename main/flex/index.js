// Flex is a reverse RPC interface for calling into the renderer's chromium process and recieving callbacks/events

const EventEmitter = require('events')
const { ipcMain } = require('electron')
const uuid = require('uuid/v4')

const windows = require('../windows')

const defined = value => value !== undefined || value !== null

class Flex extends EventEmitter {
  setReady () {
    this.ready = true
    this.emit('ready')
  }
  rpc (...args) {
    let cb = args.pop()
    if (typeof cb !== 'function') throw new Error('Flex methods require a callback')
    let id = uuid()
    handlers[id] = cb
    args = args.map(arg => defined(arg) ? JSON.stringify(arg) : arg)
    windows.send('tray', 'main:flex', JSON.stringify(id), ...args)
  }
  synthetic (...args) {
    let cb = args.pop()
    if (typeof cb !== 'function') throw new Error('Flex methods require a callback')
    let id = uuid()
    handlers[id] = cb
    args = args.map(arg => defined(arg) ? JSON.stringify(arg) : arg)
    windows.send('tray', 'main:flex', JSON.stringify(id), JSON.stringify('synthetic'), ...args)
  }
}

const flex = new Flex()

const handlers = {}

ipcMain.on('tray:flex:res', (sender, id, ...args) => {
  if (!handlers[id]) return console.log('Message from main RPC had no handler.')
  args = args.map(arg => defined(arg) ? JSON.parse(arg) : arg)
  handlers[id](...args)
  delete handlers[id]
})

ipcMain.on('tray:flex:event', (sender, eventName, ...args) => {
  args = args.map(arg => defined(arg) ? JSON.parse(arg) : arg)
  flex.emit(eventName, ...args)
})

ipcMain.on('tray:flex:needSynthetic', (sender, eventName, ...args) => {
  console.log('needSynthetic')
  // windows.getTray().webContents.sendInputEvent({ type: 'mouseDown', x: -124816, y: -124816 })
  // console.log(eventName, ...args)
  // args = args.map(arg => defined(arg) ? JSON.parse(arg) : arg)
  // flex.emit(eventName, ...args)
})

ipcMain.on('tray:ready', () => flex.setReady())

// If flex is already ready, trigger new 'ready' listeners
flex.on('newListener', (e, listener) => { if (e === 'ready' && flex.ready) listener() })

module.exports = flex
