const electron = require('electron')
const { BrowserWindow, ipcMain, Tray } = electron
const path = require('path')
const uuid = require('uuid/v4')
const url = require('url')
const Positioner = require('electron-positioner')

const store = require('../store')

const dev = process.env.NODE_ENV === 'development'
const demo = process.env.NODE_ENV === 'demo'
const winId = e => e.sender.webContents.browserWindowOptions.id
const windows = {}
let tray
let lock = 0

const api = {
  tray: () => {
    tray = new Tray(path.join(__dirname, './IconTemplate.png'))
    tray.setHighlightMode('never')
    tray.on('click', api.trayClick)
    windows.tray = new BrowserWindow({id: 'tray', width: 360, height: 800, frame: false, transparent: true, hasShadow: false, show: false, alwaysOnTop: true, backgroundThrottling: false, webPreferences: {experimentalFeatures: true, plugins: true}})
    windows.tray.loadURL(url.format({pathname: path.join(__dirname, '../../app/tray.html'), protocol: 'file:', slashes: true}))
    windows.tray.on('closed', () => delete windows.tray)
    windows.tray.setMovable(false)
    windows.tray.positioner = new Positioner(windows.tray)
    if (!dev && !demo) windows.tray.on('blur', _ => { if (windows.tray.isVisible()) api.hideTray() })
    api.showTray()
  },
  trayClick: () => {
    windows.tray.isVisible() ? api.hideTray() : api.showTray()
  },
  hideTray: () => {
    let now = Date.now()
    if (now - lock < 700) { return } else { lock = now }
    windows.tray.send('main:trayOpen', false)
    setTimeout(_ => windows.tray.hide(), 700)
  },
  showTray: (retry) => {
    let now = Date.now()
    if (now - lock < 700) { return setTimeout(() => { if (retry) api.showTray(true) }, 700) } else { lock = now }
    if (!windows.tray) return api.tray()
    if (windows.tray.isVisible()) return
    let pos = windows.tray.positioner.calculate('topRight')
    windows.tray.setVisibleOnAllWorkspaces(true)
    windows.tray.focus()
    windows.tray.setVisibleOnAllWorkspaces(false)
    windows.tray.setResizable(false)
    windows.tray.setPosition(pos.x, pos.y)
    let screen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    windows.tray.setPosition(pos.x, pos.y)
    windows.tray.setSize(370, screen.workArea.height)
    windows.tray.show()
    windows.tray.send('main:trayOpen', true)
  },
  create: () => {
    let id = uuid()
    let win = new BrowserWindow({id, width: 1400, height: 800, frame: false, show: false, backgroundThrottling: false, webPreferences: {experimentalFeatures: true, plugins: true}})
    windows[id] = win
    win.loadURL(url.format({pathname: path.join(__dirname, '../../app/window.html'), protocol: 'file:', slashes: true}))
    win.once('ready-to-show', () => win.show())
    win.on('closed', () => delete windows[id])
  },
  close: (e) => {
    let id = winId(e)
    if (windows[id]) windows[id].close()
    delete windows[id]
  },
  send: (id, channel, ...args) => {
    windows[id].send(channel, ...args)
  },
  broadcast: (channel, ...args) => {
    Object.keys(windows).forEach(id => windows[id].send(channel, ...args))
  },
  minimize: (e) => {
    let id = winId(e)
    if (windows[id]) windows[id].minimize()
  },
  full: (e) => {
    let id = winId(e)
    if (windows[id]) windows[id].setFullScreen(!windows[id].isFullScreen())
  },
  devTools: (e) => {
    let id = winId(e)
    if (windows[id]) windows[id].webContents.openDevTools()
  },
  activate: () => {
    if (Object.keys(windows).length === 1) api.create()
  }
}

// Frame Events
ipcMain.on('frame:close', api.close)
ipcMain.on('frame:minimize', api.minimize)
ipcMain.on('frame:full', api.full)
ipcMain.on('frame:devTools', api.devTools)
ipcMain.on('frame:showTray', () => api.showTray(true))

// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))

module.exports = api
