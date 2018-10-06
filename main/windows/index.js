const electron = require('electron')
const { app, BrowserWindow, ipcMain, Tray, Menu } = electron
const path = require('path')
const Positioner = require('electron-positioner')

const store = require('../store')

const dev = process.env.NODE_ENV === 'development'
const winId = e => e.sender.webContents.browserWindowOptions.id
const windows = {}
let tray
let lock = 0

let hideTimeout

const api = {
  tray: () => {
    tray = new Tray(path.join(__dirname, process.platform === 'darwin' ? './IconTemplate.png' : './Icon.png'))
    tray.setHighlightMode('never')
    tray.on('click', api.trayClick)
    const webPreferences = { nodeIntegration: false, contextIsolation: true, preload: path.resolve(__dirname, '../../bundle/bridge.js') }
    windows.tray = new BrowserWindow({ id: 'tray', width: 360, frame: false, transparent: true, hasShadow: false, show: false, alwaysOnTop: true, backgroundThrottling: false, webPreferences })
    windows.tray.loadURL(`file://${__dirname}/../../bundle/tray.html`)
    windows.tray.on('closed', () => delete windows.tray)
    windows.tray.webContents.on('will-navigate', e => e.preventDefault()) // Prevent navigation
    windows.tray.webContents.on('will-attach-webview', e => e.preventDefault()) // Prevent attaching <webview>
    windows.tray.webContents.on('new-window', e => e.preventDefault()) // Prevent new windows
    windows.tray.setMovable(false)
    windows.tray.positioner = new Positioner(windows.tray)
    if (process.platform === 'linux') {
      const menuShow = Menu.buildFromTemplate([{ label: 'Show', click: () => api.showTray() }, { label: 'Quit', click: () => api.quit() }])
      const menuHide = Menu.buildFromTemplate([{ label: 'Hide', click: () => api.hideTray() }, { label: 'Quit', click: () => api.quit() }])
      const onShow = _ => tray.setContextMenu(menuHide)
      const onHide = _ => tray.setContextMenu(menuShow)
      windows.tray.on('show', onShow)
      windows.tray.on('restore', onShow)
      windows.tray.on('hide', onHide)
      windows.tray.on('minimize', onHide)
    }
    if (dev) windows.tray.openDevTools()
    if (!dev) {
      setTimeout(() => windows.tray.on('blur', _ => {
        if (windows.tray.isVisible()) hideTimeout = setTimeout(() => api.hideTray(), 500)
      }), 3000)
    }
    api.showTray()
  },
  trayClick: () => {
    windows.tray.isVisible() ? api.hideTray() : api.showTray()
  },
  hideTray: () => {
    let now = Date.now()
    if (now - lock < 700) { return } else { lock = now }
    windows.tray.send('main:action', 'trayOpen', false)
    setTimeout(_ => windows.tray.hide(), 700)
  },
  showTray: () => {
    clearTimeout(hideTimeout)
    if (windows.tray.isVisible()) return
    let now = Date.now()
    if (now - lock < 700) return setTimeout(api.showTray, 700)
    lock = now
    if (!windows.tray) return api.tray()
    let pos = windows.tray.positioner.calculate('topRight')
    windows.tray.setVisibleOnAllWorkspaces(true)
    windows.tray.focus()
    windows.tray.setVisibleOnAllWorkspaces(false)
    windows.tray.setResizable(false)
    windows.tray.setPosition(pos.x, pos.y)
    let screen = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint())
    windows.tray.setPosition(pos.x, pos.y)
    windows.tray.setSize(370, dev ? 740 : screen.workArea.height)
    windows.tray.show()
    setTimeout(() => windows.tray.focus(), 700)
    windows.tray.send('main:action', 'trayOpen', true)
    windows.tray.send('main:action', 'setSignerView', 'default')
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
    api.showTray()
  },
  quit: () => {
    app.quit()
  }
}

app.on('web-contents-created', (e, contents) => {
  contents.on('will-navigate', e => e.preventDefault())
  contents.on('will-attach-webview', e => e.preventDefault())
  contents.on('new-window', e => e.preventDefault())
})

// Frame Events
ipcMain.on('frame:close', api.close)
ipcMain.on('frame:minimize', api.minimize)
ipcMain.on('frame:full', api.full)
ipcMain.on('frame:devTools', api.devTools)
ipcMain.on('frame:showTray', api.showTray)

// Tray Events
ipcMain.on('tray:quit', api.quit)

// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))

module.exports = api
