// Flex is a reverse RPC interface for calling into the renderer's chromium process and recieving callbacks/events

const EventEmitter = require('events')
const { ipcMain } = require('electron')
const uuid = require('uuid/v4')

const windows = require('../windows')

const defined = value => value !== undefined || value !== null

class Flex extends EventEmitter {
  constructor () {
    super()
    this.on('ledger:scan:failed', err => {
      console.log('ledger:scan:failed')
      console.log(err)
      setTimeout(() => this.triggerScan(), 4000)
    })
  }
  triggerScan () {
    windows.getTray().webContents.sendInputEvent({ type: 'mouseDown', x: -124816, y: -124816 })
  }
  setReady () {
    this.ready = true
    this.triggerScan()
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
}

const flex = new Flex()

// ipcMain.on('bluetooth-select-device', (devices) => {
//   console.log('bluetooth-select-device')
//   console.log(devices)
// })

// const flex = require('../../flex')
//
// flex.on('ready', () => {
//   flex.rpc('ledger.test', 'weee', (err, value) => {
//     if (err) return console.log(err)
//     console.log(value)
//   })
//   flex.on('ledger:device:added', device => {
//     console.log('Found ledger device')
//   })
// })

const handlers = {}

ipcMain.on('tray:flex:res', (sender, id, ...args) => {
  if (!handlers[id]) return console.log('Message from main RPC had no handler.')
  args = args.map(arg => defined(arg) ? JSON.parse(arg) : arg)
  handlers[id](...args)
  delete handlers[id]
})

ipcMain.on('tray:flex:event', (sender, eventName, ...args) => {
  console.log(eventName, ...args)
  flex.emit(eventName, ...args)
})

ipcMain.on('tray:ready', () => flex.setReady())

// If flex is already ready, trigger new 'ready' listeners
flex.on('newListener', (e, listener) => { if (e === 'ready' && flex.ready) listener() })

module.exports = flex
