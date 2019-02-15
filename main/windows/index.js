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
let reloadTimeout, resetTimeout, mouseTimeout

let hideOnMouseOut = false

const detectMouse = () => {
  let m1 = electron.screen.getCursorScreenPoint()
  let area = electron.screen.getDisplayNearestPoint(m1).workArea
  let minX = (area.width + area.x) - 2
  let center = (area.height + area.y) / 2
  let margin = (area.height + area.y) / 8
  let minY = center - margin
  let maxY = center + margin
  mouseTimeout = setTimeout(() => {
    if (m1.x >= minX && m1.y >= minY && m1.y <= maxY) {
      let m2 = electron.screen.getCursorScreenPoint()
      if (m2.x >= minX && m2.y === m1.y) {
        hideOnMouseOut = true
        api.showTray()
      } else {
        detectMouse()
      }
    } else {
      detectMouse()
    }
  }, 200)
}

const api = {
  create: () => {
    const webPreferences = { nodeIntegration: false, contextIsolation: true, preload: path.resolve(__dirname, '../../bundle/bridge.js') }
    windows.tray = new BrowserWindow({ id: 'tray', width: 360, frame: false, transparent: true, hasShadow: false, show: false, backgroundThrottling: false, webPreferences, icon: path.join(__dirname, './AppIcon.png'), skipTaskbar: process.platform !== 'linux' })
    windows.tray.loadURL(`file://${__dirname}/../../bundle/tray.html`)
    windows.tray.on('closed', () => delete windows.tray)
    windows.tray.webContents.on('will-navigate', e => e.preventDefault()) // Prevent navigation
    windows.tray.webContents.on('will-attach-webview', e => e.preventDefault()) // Prevent attaching <webview>
    windows.tray.webContents.on('new-window', e => e.preventDefault()) // Prevent new windows
    windows.tray.positioner = new Positioner(windows.tray)
    windows.tray.setResizable(false)
    windows.tray.setMovable(false)
    windows.tray.setSize(0, 0)
    let area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    windows.tray.setPosition(area.width + area.x, area.height + area.y)
    windows.tray.on('hide', () => { if (needReload) api.reload() })
    if (process.platform === 'linux') {
      const menuShow = Menu.buildFromTemplate([{ label: 'Show', click: () => api.showTray() }, { label: 'Quit', click: () => api.quit() }])
      const menuHide = Menu.buildFromTemplate([{ label: 'Hide', click: () => api.hideTray() }, { label: 'Quit', click: () => api.quit() }])
      const onShow = _ => tray.setContextMenu(menuHide)
      const onHide = _ => tray.setContextMenu(menuShow)
      windows.tray.on('show', onShow)
      windows.tray.on('hide', onHide)
      setTimeout(() => {
        windows.tray.on('focus', () => { if (hideShow.current = 'hidden') api.showTray() })
      }, 2000)
    }
    if (dev) windows.tray.openDevTools()
    if (!dev) {
      setTimeout(() => {
        windows.tray.on('blur', _ => api.hideTray())
        windows.tray.focus()
      }, 1260)
    }
    setTimeout(() => {
      windows.tray.show()
      setTimeout(() => api.showTray(), process.platform === 'linux' ? 210 : 0)
    }, 50)
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
        if (windows && windows.tray) {
          if (store('main.reveal')) detectMouse()
          windows.tray.setVisibleOnAllWorkspaces(true)
          windows.tray.setAlwaysOnTop(false)
          windows.tray.setResizable(true)
          windows.tray.setSize(0, 0)
          let area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
          windows.tray.setPosition(area.width + area.x, area.height + area.y)
          windows.tray.emit('hide')
        }
        if (hideShow.next === 'show') setTimeout(() => api.showTray(), 0)
        hideShow.running = false
        hideShow.next = false
      }, 260)
    }
  },
  showTray: () => {
    clearTimeout(mouseTimeout)
    hideShow.current = 'showing'
    if (hideShow.running) {
      hideShow.next = false
      if (hideShow.running !== 'show') hideShow.next = 'show'
    } else {
      if (!windows.tray) return api.tray()
      windows.tray.setAlwaysOnTop(true)
      hideShow.running = 'show'
      windows.tray.setVisibleOnAllWorkspaces(true)
      windows.tray.setResizable(false) // Makes no sense but keeps height consistant
      let area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
      windows.tray.setSize(360, dev ? 740 : area.height)
      let pos = windows.tray.positioner.calculate('topRight')
      windows.tray.setPosition(pos.x, pos.y)
      windows.tray.focus()
      windows.tray.emit('show')
      windows.tray.send('main:action', 'trayOpen', true)
      windows.tray.send('main:action', 'setSignerView', 'default')
      setTimeout(() => {
        if (windows && windows.tray && windows.tray.focus) windows.tray.focus()
        if (hideShow.next === 'hide') setTimeout(() => api.hideTray(), 0)
        hideShow.running = false
        hideShow.next = false
        windows.tray.setVisibleOnAllWorkspaces(false)
      }, 260)
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

ipcMain.on('tray:mouseout', () => {
  if (hideOnMouseOut) {
    hideOnMouseOut = false
    api.hideTray()
  }
})

// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))
store.observer(_ => api.broadcast('main:action', 'syncMain', store('main')))

module.exports = api
