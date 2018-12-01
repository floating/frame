const electron = require('electron')
const { app, BrowserWindow, ipcMain, Tray, Menu } = electron
const path = require('path')
const Positioner = require('electron-positioner')
const log = require('electron-log')

const store = require('../store')

const dev = process.env.NODE_ENV === 'development'
const winId = e => e.sender.webContents.browserWindowOptions.id
const windows = {}
let tray

let hideShow = { current: false, running: false, next: false }

let showOnReady = true
let needReload = false
let reloadTimeout, resetTimeout

const api = {
  create: () => {
    const webPreferences = { nodeIntegration: false, contextIsolation: true, preload: path.resolve(__dirname, '../../bundle/bridge.js') }
    windows.tray = new BrowserWindow({ id: 'tray', width: 360, frame: false, transparent: true, hasShadow: false, show: false, alwaysOnTop: true, backgroundThrottling: false, webPreferences, icon: path.join(__dirname, './AppIcon.png') })
    windows.tray.loadURL(`file://${__dirname}/../../bundle/tray.html`)
    windows.tray.on('closed', () => delete windows.tray)
    windows.tray.webContents.on('will-navigate', e => e.preventDefault()) // Prevent navigation
    windows.tray.webContents.on('will-attach-webview', e => e.preventDefault()) // Prevent attaching <webview>
    windows.tray.webContents.on('new-window', e => e.preventDefault()) // Prevent new windows
    windows.tray.setMovable(false)
    windows.tray.positioner = new Positioner(windows.tray)
    windows.tray.on('hide', () => {
      if (needReload) api.reload()
    })
    if (process.platform === 'linux') {
      const menuShow = Menu.buildFromTemplate([{ label: 'Show', click: () => api.showTray() }, { label: 'Quit', click: () => api.quit() }])
      const menuHide = Menu.buildFromTemplate([{ label: 'Hide', click: () => api.hideTray() }, { label: 'Quit', click: () => api.quit() }])
      const onShow = _ => tray.setContextMenu(menuHide)
      const onHide = _ => tray.setContextMenu(menuShow)
      windows.tray.on('show', onShow)
      windows.tray.on('hide', onHide)
      windows.tray.on('minimize', () => {
        onHide()
        if (needReload) api.reload()
      })
      windows.tray.hide = windows.tray.minimize
      windows.tray.on('restore', () => {
        api.showTray()
        onShow()
      })
    }
    if (dev) windows.tray.openDevTools()
    if (!dev) setTimeout(() => windows.tray.on('blur', _ => api.hideTray()), 420)
    api.showTray()
    resetTimeout = setTimeout(() => api.reset(), 60 * 60 * 1000)
  },
  reload: () => {
    log.info('Tray Reset: Reloading')
    needReload = false
    clearTimeout(reloadTimeout)
    clearTimeout(resetTimeout)
    if (windows.tray && windows.tray.reload) windows.tray.reload()
    resetTimeout = setTimeout(() => api.reset(), 60 * 60 * 1000)
  },
  reset: () => {
    log.info('Attempting Tray Reset...')
    showOnReady = false
    if (hideShow.current === 'showing') {
      log.info('Tray Reset: Window visiable/in-use, try again on hide')
      needReload = true
      reloadTimeout = setTimeout(() => api.reload(), 60 * 60 * 1000) // When left open
    } else {
      log.info('Tray Reset: Window hidden, resetting')
      api.reload()
    }
  },
  tray: () => {
    tray = new Tray(path.join(__dirname, process.platform === 'darwin' ? './IconTemplate.png' : './Icon.png'))
    tray.setHighlightMode('never')
    tray.on('click', api.trayClick)
    api.create()
  },
  trayClick: () => {
    let showing = hideShow.current ? hideShow.current === 'showing' : windows.tray.isVisible()
    showing ? api.hideTray() : api.showTray()
  },
  hideTray: () => {
    hideShow.current = 'hidden'
    if (hideShow.running) {
      hideShow.next = false
      if (hideShow.running !== 'hide') hideShow.next = 'hide'
    } else {
      hideShow.running = 'hide'
      windows.tray.send('main:action', 'trayOpen', false)
      setTimeout(() => {
        windows.tray.hide()
        if (hideShow.next === 'show') setTimeout(() => api.showTray(), 0)
        hideShow.running = false
        hideShow.next = false
      }, 420)
    }
  },
  showTray: () => {
    hideShow.current = 'showing'
    if (hideShow.running) {
      hideShow.next = false
      if (hideShow.running !== 'show') hideShow.next = 'show'
    } else {
      if (!windows.tray) return api.tray()
      hideShow.running = 'show'
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
      windows.tray.send('main:action', 'trayOpen', true)
      windows.tray.send('main:action', 'setSignerView', 'default')
      setTimeout(() => {
        windows.tray.focus()
        if (hideShow.next === 'hide') setTimeout(() => api.hideTray(), 0)
        hideShow.running = false
        hideShow.next = false
      }, 420)
    }
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
// ipcMain.on('frame:close', api.close)
// ipcMain.on('frame:minimize', api.minimize)
// ipcMain.on('frame:full', api.full)
// ipcMain.on('frame:devTools', api.devTools)
// ipcMain.on('frame:showTray', api.showTray)

// Tray Events
ipcMain.on('tray:quit', api.quit)
ipcMain.on('tray:ready', () => {
  if (showOnReady) windows.tray.send('main:action', 'trayOpen', true)
})

// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))
store.observer(_ => api.broadcast('main:action', 'syncMain', store('main')))

module.exports = api
