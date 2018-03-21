const electron = require('electron')
const { BrowserWindow, ipcMain, Tray } = electron
const path = require('path')
const uuid = require('uuid/v4')
const url = require('url')
const Positioner = require('electron-positioner')

const store = require('../store')

const winId = e => e.sender.webContents.browserWindowOptions.id
const windows = {}
let tray, bounds

const api = {
  tray: () => {
    tray = new Tray(path.join(__dirname, './IconTemplate.png'))
    tray.setHighlightMode('never')
    bounds = tray.getBounds()
    tray.on('click', api.trayClick)
    windows.tray = new BrowserWindow({id: 'tray', width: 360, height: 800, frame: false, show: false, alwaysOnTop: true, backgroundThrottling: false, webPreferences: {experimentalFeatures: true, plugins: true}})
    windows.tray.loadURL(url.format({pathname: path.join(__dirname, '../../app/tray.html'), protocol: 'file:', slashes: true}))
    windows.tray.on('closed', () => delete windows.tray)
    windows.tray.setMovable(false)
    windows.tray.on('blur', _ => api.hideTray())
    windows.tray.positioner = new Positioner(windows.tray)
  },
  trayClick: (e, newBounds) => {
    if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return api.hideTray()
    bounds = newBounds && newBounds.x !== 0 ? newBounds : bounds
    let noBound = bounds === undefined || bounds.x === 0
    let win32 = process.platform === 'win32'
    let pos = noBound ? win32 ? 'bottomRight' : 'topRight' : win32 ? 'trayBottomCenter' : 'trayCenter'
    api.showTray(pos, bounds)
  },
  hideTray: () => windows.tray.hide(),
  showTray: (pos, bounds, height) => {
    if (!windows.tray) return api.tray()
    if (windows.tray.isVisible()) return api.hideTray()
    pos = windows.tray.positioner.calculate(pos, bounds)
    windows.tray.setVisibleOnAllWorkspaces(true)
    windows.tray.focus()
    windows.tray.setVisibleOnAllWorkspaces(false)
    windows.tray.setResizable(false)
    if (process.platform === 'win32') pos.y = 50
    windows.tray.setPosition(pos.x, pos.y)
    let activeScreen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    windows.tray.setSize(360, activeScreen.size.height - bounds.height - 50, false)
    windows.tray.show()
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
ipcMain.on('frame:showTray', () => { if (windows.tray) windows.tray.show() })

// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))

module.exports = api
