const electron = require('electron')
const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut } = electron
const path = require('path')
const log = require('electron-log')

const EventEmitter = require('events')
const events = new EventEmitter()

const store = require('../store')

const dev = process.env.NODE_ENV === 'development'
const winId = e => e.sender.webContents.browserWindowOptions.id
const windows = {}
let tray

const openedAtLogin = app && app.getLoginItemSettings() && app.getLoginItemSettings().wasOpenedAtLogin

const hideShow = { current: false, running: false, next: false }

const showOnReady = true
// let needReload = false
// let reloadTimeout, resetTimeout
let mouseTimeout

let glide = false

const topRight = (window) => {
  // pinArea ||
  const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
  const screenSize = area
  const windowSize = window.getSize()
  return {
    x: Math.floor(screenSize.x + screenSize.width - windowSize[0]),
    y: screenSize.y
  }
}

const detectMouse = () => {
  const m1 = electron.screen.getCursorScreenPoint()
  const display = electron.screen.getDisplayNearestPoint(m1)
  const area = display.workArea
  const bounds = display.bounds
  const minX = (area.width + area.x) - 2
  const center = (area.height + (area.y - bounds.y)) / 2
  const margin = ((area.height + (area.y - bounds.y)) / 2) - 5
  m1.y = m1.y - area.y
  const minY = center - margin
  const maxY = center + margin
  mouseTimeout = setTimeout(() => {
    if (m1.x >= minX && m1.y >= minY && m1.y <= maxY) {
      const m2 = electron.screen.getCursorScreenPoint()
      const area = electron.screen.getDisplayNearestPoint(m2).workArea
      m2.y = m2.y - area.y
      if (m2.x >= minX && m2.y === m1.y) {
        glide = true
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
    windows.tray = new BrowserWindow({
      id: 'tray',
      width: 360,
      frame: false,
      transparent: true,
      hasShadow: false,
      // show: false,
      backgroundThrottling: false,
      offscreen: true,
      icon: path.join(__dirname, './AppIcon.png'),
      skipTaskbar: process.platform !== 'linux',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        disableBlinkFeatures: 'Auxclick',
        enableRemoteModule: false,
        preload: path.resolve(__dirname, '../../bundle/bridge.js'),
        worldSafeExecuteJavaScript: true
      }
    })
    windows.tray.loadURL(path.join('file://', __dirname, '/../../bundle/tray.html'))
    windows.tray.on('closed', () => delete windows.tray)
    windows.tray.webContents.on('will-navigate', e => e.preventDefault()) // Prevent navigation
    windows.tray.webContents.on('will-attach-webview', e => e.preventDefault()) // Prevent attaching <webview>
    windows.tray.webContents.on('new-window', e => e.preventDefault()) // Prevent new windows
    // windows.tray.webContents.session.webRequest.onHeadersReceived({}, (details, res) => {
    //   const trezor = details.url.startsWith('https://connect.trezor.io')
    //   if (trezor && details.responseHeaders['x-frame-options']) delete details.responseHeaders['x-frame-options'] // remove 'x-frame-options' header to allow embedding https://connect.trezor.io into an 'iframe' for Tezor flex work around
    //   res({ cancel: false, responseHeaders: details.responseHeaders })
    // })
    windows.tray.webContents.session.setPermissionRequestHandler((webContents, permission, res) => res(false))
    windows.tray.setResizable(false)
    windows.tray.setMovable(false)
    windows.tray.setSize(0, 0)
    const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    windows.tray.setPosition(area.width + area.x, area.height + area.y)
    // windows.tray.on('hide', () => { if (needReload) api.reload() })
    if (process.platform === 'linux') {
      const menuShow = Menu.buildFromTemplate([{ label: 'Show', click: () => api.showTray() }, { label: 'Quit', click: () => api.quit() }])
      const menuHide = Menu.buildFromTemplate([{ label: 'Hide', click: () => api.hideTray() }, { label: 'Quit', click: () => api.quit() }])
      windows.tray.on('show', () => {
        tray.setContextMenu(menuHide)
      })
      windows.tray.on('hide', () => {
        windows.tray.blur()
        tray.setContextMenu(menuShow)
      })
      setTimeout(() => {
        windows.tray.on('focus', () => { if (hideShow.current === 'hidden') api.showTray() })
      }, 2000)
    }
    if (dev) windows.tray.openDevTools()
    setTimeout(() => {
      windows.tray.on('blur', _ => store('main.autohide') ? api.hideTray(true) : null)
      windows.tray.focus()
    }, 1260)
    if (!openedAtLogin) {
      setTimeout(() => {
        if (windows && windows.tray) windows.tray.show()
        setTimeout(() => api.showTray(), process.platform === 'linux' ? 210 : 0)
      }, 50)
    }

    setTimeout(() => {
      electron.screen.on('display-added', () => api.hideTray())
      electron.screen.on('display-removed', () => api.hideTray())
      electron.screen.on('display-metrics-changed', () => api.hideTray())
    }, 30 * 1000)
    // resetTimeout = setTimeout(() => api.reset(), 60 * 60 * 1000)
  },
  // reload: () => {
  //   log.info('Tray Reset: Reloading')
  //   needReload = false
  //   clearTimeout(reloadTimeout)
  //   clearTimeout(resetTimeout)
  //   if (windows.tray && windows.tray.reload) windows.tray.reload()
  //   resetTimeout = setTimeout(() => api.reset(), 60 * 60 * 1000)
  // },
  // reset: () => {
  //   log.info('Attempting Tray Reset...')
  //   showOnReady = false
  //   if (hideShow.current === 'showing') {
  //     log.info('Tray Reset: Window visiable/in-use, try again on hide')
  //     needReload = true
  //     reloadTimeout = setTimeout(() => api.reload(), 60 * 60 * 1000) // When left open
  //   } else {
  //     log.info('Tray Reset: Window hidden, resetting')
  //     api.reload()
  //   }
  // },
  tray: () => {
    tray = new Tray(path.join(__dirname, process.platform === 'darwin' ? './IconTemplate.png' : './Icon.png'))
    // tray.setHighlightMode('never')
    if (this.gasObserver) this.gasObserver.close()
    this.gasObserver = store.observer(() => {
      let title = ''
      if (store('platform') === 'darwin' && store('main.menubarGasPrice')) {
        const gasPrice = store('main.networks.ethereum.1.gas.price.levels.standard')
        if (!gasPrice) return
        const gasDisplay = Math.round(parseInt(gasPrice, 'hex') / 1000000000).toString()
        title = gasDisplay // ɢ 🄶 Ⓖ ᴳᵂᴱᴵ
      }
      if (tray && tray.setTitle) tray.setTitle(title)
    })
    tray.on('click', api.trayClick)
    api.create()
  },
  trayClick: () => {
    if (this.recentAutohide) return
    const showing = hideShow.current ? hideShow.current === 'showing' : windows.tray.isVisible()
    showing ? api.hideTray() : api.showTray()
  },
  hideTray: (autohide) => {
    if (autohide) {
      this.recentAutohide = true
      clearTimeout(this.recentAutohide)
      this.recentAutohideTimeout = setTimeout(() => {
        this.recentAutohide = false
      }, 400)
    }
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
          windows.tray.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
          windows.tray.setAlwaysOnTop(false)
          const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
          windows.tray.setResizable(true)
          windows.tray.setSize(1, dev ? 740 : area.height)
          const pos = topRight(windows.tray)
          windows.tray.setPosition(area.width + area.x, pos.y)
          windows.tray.emit('hide')
          windows.tray.hide()
          events.emit('tray:hide')
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
      windows.tray.setPosition(0, 0)
      windows.tray.setAlwaysOnTop(true)
      hideShow.running = 'show'
      windows.tray.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      windows.tray.setResizable(false) // Keeps height consistant
      const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
      windows.tray.setSize(360, dev ? 740 : area.height)
      const pos = topRight(windows.tray) // windows.tray.positioner.calculate('topRight')
      windows.tray.setPosition(pos.x, pos.y)
      if (!glide) windows.tray.focus()
      windows.tray.emit('show')
      windows.tray.show()
      windows.tray.send('main:action', 'trayOpen', true)
      windows.tray.send('main:action', 'setSignerView', 'default')
      events.emit('tray:show')
      setTimeout(() => {
        if (windows && windows.tray && windows.tray.focus && !glide) windows.tray.focus()
        if (hideShow.next === 'hide') setTimeout(() => api.hideTray(), 0)
        hideShow.running = false
        hideShow.next = false
        windows.tray.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true })
      }, 260)
    }
  },
  close: (e) => {
    const id = winId(e)
    if (windows[id]) windows[id].close()
    delete windows[id]
  },
  getTray: () => {
    return windows.tray
  },
  send: (id, channel, ...args) => {
    if (!windows[id]) return log.error(new Error(`A window with id "${id}" does not exist (windows.send)`))
    windows[id].send(channel, ...args)
  },
  broadcast: (channel, ...args) => {
    Object.keys(windows).forEach(id => windows[id].send(channel, ...args))
  },
  minimize: (e) => {
    const id = winId(e)
    if (windows[id]) windows[id].minimize()
  },
  full: (e) => {
    const id = winId(e)
    if (windows[id]) windows[id].setFullScreen(!windows[id].isFullScreen())
  },
  devTools: (e) => {
    const id = winId(e)
    if (windows[id]) windows[id].webContents.openDevTools()
  },
  activate: () => {
    api.showTray()
  },
  quit: () => {
    app.quit()
  },
  events
}

app.on('web-contents-created', (e, contents) => {
  contents.on('will-navigate', e => e.preventDefault())
  contents.on('will-attach-webview', e => e.preventDefault())
  contents.on('new-window', e => e.preventDefault())
})

if (dev) {
  const path = require('path')
  const watch = require('node-watch')
  watch(path.resolve(__dirname, '../../', 'bundle'), { recursive: true }, (evt, name) => {
    if (name.indexOf('css') > -1) windows.tray.send('main:reload:style', name)
  })
  app.on('ready', () => {
    globalShortcut.register('CommandOrControl+R', () => {
      windows.tray.reload()
    })
  })
}

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
  if (glide) {
    glide = false
    api.hideTray()
  }
})

ipcMain.on('tray:contextmenu', (e, x, y) => { if (dev) windows.tray.inspectElement(x, y) })

// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))
store.observer(_ => api.broadcast('main:action', 'syncMain', store('main')))

module.exports = api
