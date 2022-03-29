const electron = require('electron')
const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut } = electron
const url = require('url')
const path = require('path')
const log = require('electron-log')

const EventEmitter = require('events')
const events = new EventEmitter()

const store = require('../store').default

const extractColors = require('./extractColors').default

const FrameManager = require('./frames').default

const dev = process.env.NODE_ENV === 'development'
const fullheight = !!process.env.FULL_HEIGHT

const winId = e => e.sender.webContents.browserWindowOptions.id
const windows = {}
const frameManager = new FrameManager()
let tray, trayReady

const openedAtLogin = app && app.getLoginItemSettings() && app.getLoginItemSettings().wasOpenedAtLogin

// const hideShow = { current: false, running: false, next: false }

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

const center = (window) => {
  // pinArea ||
  const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
  const screenSize = area
  const windowSize = window.getSize()
  return {
    x: Math.floor(((screenSize.x + screenSize.width) - (screenSize.width / 2)) - (windowSize[0] / 2)),
    y: Math.floor(((screenSize.y + screenSize.height) - (screenSize.height / 2)) - (windowSize[1] / 2))
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
  }, 50)
}

const api = {
  create: () => {
    windows.tray = new BrowserWindow({
      id: 'tray',
      width: 360,
      frame: false,
      // transparent: true,
      // hasShadow: false,
      show: false,
      backgroundColor: store('main.colorwayPrimary', store('main.colorway'), 'background'),
      backgroundThrottling: false,
      // offscreen: true,
      icon: path.join(__dirname, './AppIcon.png'),
      skipTaskbar: process.platform !== 'linux',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        disableBlinkFeatures: 'Auxclick',
        enableRemoteModule: false,
        preload: path.resolve(process.env.BUNDLE_LOCATION, 'bridge.js'),
        worldSafeExecuteJavaScript: true,
        backgroundThrottling: false // Allows repaint when window is hidden
      }
    })

    const trayUrl = url.format({
      pathname: path.join(process.env.BUNDLE_LOCATION, 'tray.html'),
      protocol: 'file',
      slashes: true
    })

    windows.tray.loadURL(trayUrl)

    windows.tray.on('closed', () => delete windows.tray)
    windows.tray.webContents.on('will-navigate', e => e.preventDefault()) // Prevent navigation
    windows.tray.webContents.on('will-attach-webview', e => e.preventDefault()) // Prevent attaching <webview>
    windows.tray.webContents.on('new-window', e => e.preventDefault()) // Prevent new windows
    // windows.tray.webContents.session.webRequest.onHeadersReceived({}, (details, res) => {
    //   const trezor = details.url.startsWith('https://connect.trezor.io')
    //   if (trezor && details.responseHeaders['x-frame-options']) delete details.responseHeaders['x-frame-options'] // remove 'x-frame-options' header to allow embedding https://connect.trezor.io into an 'iframe' for Tezor flex work around
    //   res({ cancel: false, responseHeaders: details.responseHeaders })
    // })
    windows.tray.webContents.session.setPermissionRequestHandler((webContents, permission, res) => {
      const page = webContents.getURL().split('/').pop()
      if ((page === 'dash.html' || page === 'tray.html') && permission === 'media') {
        return res(true)
      }
      res(false)
    })
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
        tray.setContextMenu(menuShow)
      })
      setTimeout(() => {
        windows.tray.on('focus', () => api.showTray())
      }, 2000)
    }
    if (dev) windows.tray.openDevTools()
    setTimeout(() => {
      windows.tray.on('blur', _ => {
        const frameShowing = frameManager.isFrameShowing()
        if (store('main.autohide') && !store('dash.showing') && !frameShowing) api.hideTray(true)
      })
      windows.tray.focus()
    }, 1260)
    if (!openedAtLogin) {
      windows.tray.once('ready-to-show', () => {
        api.showTray()
      })
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
    if (this.gasObserver) this.gasObserver.remove()
    this.gasObserver = store.observer(() => {
      let title = ''
      if (store('platform') === 'darwin' && store('main.menubarGasPrice')) {
        const currentNetwork = store('main.currentNetwork')
        const gasPrice = store('main.networksMeta.ethereum', currentNetwork.id, 'gas.price.levels.fast')
        if (!gasPrice) return
        const gasDisplay = Math.round(parseInt(gasPrice, 'hex') / 1000000000).toString()
        title = gasDisplay // ɢ 🄶 Ⓖ ᴳᵂᴱᴵ
      }
      if (tray && tray.setTitle) tray.setTitle(title)
    })
    tray.on('click', api.trayClick)
    api.create()
    // api.flow()
    api.dash()
  },
  trayClick: () => {
    if (this.recentAutohide) return
    const showing = windows.tray.isVisible()
    showing ? api.hideTray() : api.showTray()
  },
  hideTray: (autohide) => {
    store.toggleDash('hide')
    if (autohide) {
      this.recentAutohide = true
      clearTimeout(this.recentAutohide)
      this.recentAutohideTimeout = setTimeout(() => {
        this.recentAutohide = false
      }, 400)
    }
    // hideShow.current = 'hidden'
    // if (hideShow.running) {
    //   hideShow.next = false
    //   if (hideShow.running !== 'hide') hideShow.next = 'hide'
    // } else {
      // hideShow.running = 'hide'

    if (windows && windows.tray) {
      store.trayOpen(false)
      if (store('main.reveal')) detectMouse()
      // windows.tray.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      // windows.tray.setAlwaysOnTop(false)
      // const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
      // windows.tray.setResizable(true)
      // windows.tray.setSize(1, dev ? 740 : area.height)
      // const pos = topRight(windows.tray)
      // windows.tray.setPosition(area.width + area.x, pos.y)
      windows.tray.emit('hide')
      windows.tray.hide()
      events.emit('tray:hide')
      // windows.tray.setOpacity(0)
    }
  // }
  },
  showTray: () => {
    clearTimeout(mouseTimeout)
    // hideShow.current = 'showing'
    // if (hideShow.running) {
    //   hideShow.next = false
    //   if (hideShow.running !== 'show') hideShow.next = 'show'
    // } else {
    if (!windows.tray) return api.tray()
    windows.tray.setPosition(0, 0)
    windows.tray.setAlwaysOnTop(true)
    // hideShow.running = 'show'
    windows.tray.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    windows.tray.setResizable(false) // Keeps height consistant
    const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    windows.tray.setMinimumSize(358, dev && !fullheight ? 740 : area.height)
    windows.tray.setSize(358, dev && !fullheight ? 740 : area.height)
    const pos = topRight(windows.tray) // windows.tray.positioner.calculate('topRight')
    windows.tray.setPosition(pos.x, pos.y)
    if (!glide) windows.tray.focus()
    store.trayOpen(true)
    windows.tray.emit('show')
    windows.tray.show()
    events.emit('tray:show')
    if (windows && windows.tray && windows.tray.focus && !glide) windows.tray.focus()
    windows.tray.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true })
    // windows.tray.send('main:action', 'trayOpen', true)
    // windows.tray.send('main:action', 'setSignerView', 'default')

     // if (hideShow.next === 'hide') setTimeout(() => api.hideTray(), 0)
    // hideShow.running = false
    // hideShow.next = false

  },
  close: (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win.close()
  },
  max: (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win.maximize()
  },
  unmax: (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win.unmaximize()
  },
  min: (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win.minimize()
  },
  full: (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win.setFullScreen(true)
  },
  unfull: (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    win.setFullScreen(false)
  },
  getTray: () => {
    return windows.tray
  },
  send: (id, channel, ...args) => {
    if (windows[id] && !windows[id].isDestroyed() && windows[id].send) {
      windows[id].send(channel, ...args)
    } else {
      log.error(new Error(`A window with id "${id}" does not exist (windows.send)`))
    }
  },
  broadcast: (channel, ...args) => {
    Object.keys(windows).forEach(id => api.send(id, channel, ...args))

    frameManager.broadcast(channel, args)
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
  // flow: () => {
  //   windows.flow = new BrowserWindow({
  //     id: 'flow',
  //     width: 520,
  //     height: 330,
  //     frame: false,
  //     // transparent: true,
  //     // hasShadow: false,
  //     show: false,
  //     backgroundThrottling: false,
  //     offscreen: true,
  //     // icon: path.join(__dirname, './AppIcon.png'),
  //     skipTaskbar: process.platform !== 'linux',
  //     webPreferences: {
  //       nodeIntegration: false,
  //       contextIsolation: true,
  //       sandbox: true,
  //       disableBlinkFeatures: 'Auxclick',
  //       enableRemoteModule: false,
  //       preload: path.resolve(__dirname, '../../bundle/bridge.js'),
  //       worldSafeExecuteJavaScript: true,
  //       backgroundThrottling: false // Allows repaint when window is hidden
  //     }
  //   })
  //   windows.flow.loadURL(`file://${__dirname}/../../bundle/flow.html`)
  //   // windows.flow.setAlwaysOnTop(true)
  //   windows.flow.on('blur', () => api.hideFlow())
  //   // if (dev) windows.flow.openDevTools()
  // },
  showFlow: () => {
    // clearTimeout(mouseTimeout)
    // hideShow.current = 'showing'
    // if (hideShow.running) {
    //   hideShow.next = false
    //   if (hideShow.running !== 'show') hideShow.next = 'show'
    // } else {
    // if (!windows.tray) return api.tray()
    // windows.flow.setPosition(0, 0)
    // console.log('showFlow')
    windows.flow.setAlwaysOnTop(true)
    // hideShow.running = 'show'
    windows.flow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    windows.flow.setResizable(false) // Keeps height consistant
    // const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    // windows.tray.setSize(358, dev ? 740 : area.height)
    const {x, y} = center(windows.flow) // windows.tray.positioner.calculate('topRight')
    windows.flow.setPosition(x, y)
    // if (!glide) windows.tray.focus()
    // windows.flow.emit('show')
    windows.flow.show()
    windows.flow.focus()
    windows.flow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true })
  },
  hideFlow: () => {
    windows.flow.hide()
  },
  // toggleFlow: () => {
  //   if (windows.flow.isVisible()) {
  //     api.hideFlow()
  //   } else {
  //     api.showFlow()
  //   }
  // },
  dash: () => {
    windows.dash = new BrowserWindow({
      id: 'dash',
      width: 360,
      frame: false,
      // transparent: true,
      // hasShadow: false,
      show: false,
      backgroundColor: store('main.colorwayPrimary', store('main.colorway'), 'background'),
      backgroundThrottling: false,
      offscreen: true,
      // icon: path.join(__dirname, './AppIcon.png'),
      skipTaskbar: process.platform !== 'linux',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        disableBlinkFeatures: 'Auxclick',
        enableRemoteModule: false,
        preload: path.resolve(process.env.BUNDLE_LOCATION, 'bridge.js'),
        worldSafeExecuteJavaScript: true,
        backgroundThrottling: false // Allows repaint when window is hidden
      }
    })

    const dashUrl = url.format({
      pathname: path.join(process.env.BUNDLE_LOCATION, 'dash.html'),
      protocol: 'file',
      slashes: true
    })

    windows.dash.loadURL(dashUrl)
    // windows.flow.setAlwaysOnTop(true)
    // windows.dash.on('blur', () => api.hideDash())
  },
  showDash: () => {
    if (!trayReady) return
    // clearTimeout(mouseTimeout)
    // hideShow.current = 'showing'
    // if (hideShow.running) {
    //   hideShow.next = false
    //   if (hideShow.running !== 'show') hideShow.next = 'show'
    // } else {
    // if (!windows.tray) return api.tray()
    // windows.flow.setPosition(0, 0)
    // console.log('send type to dash window', type)
    //store.setDashType(type)
    setTimeout(() => {
      windows.dash.setAlwaysOnTop(true)
      // hideShow.running = 'show'
      windows.dash.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      windows.dash.setResizable(false) // Keeps height consistant
      const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
      windows.dash.setSize(360, dev && !fullheight ? 740 - 120 : area.height - 120)
      const {x, y} = topRight(windows.dash) // windows.tray.positioner.calculate('topRight')
      windows.dash.setPosition(x - 380, y + 60)
      // if (!glide) windows.tray.focus()
      // windows.flow.emit('show')
      windows.dash.show()
      windows.dash.focus()
      windows.dash.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true })
      if (dev) windows.dash.openDevTools()
    }, 10)
  },
  hideDash: () => {
    if (windows.dash && windows.dash.isVisible()) windows.dash.hide()
    // store.setDashType()
  },
  refocusFrame: (frameId) => {
    frameManager.refocus(frameId)
  },
  events,
  extractColors
}

app.on('web-contents-created', (e, contents) => {
  contents.on('will-navigate', e => e.preventDefault())
  contents.on('will-attach-webview', e => e.preventDefault())
  contents.on('new-window', e => e.preventDefault())
})

app.on('ready', () => {
  frameManager.start()
})

if (dev) {
  const path = require('path')
  const watch = require('node-watch')
  watch(path.resolve(process.env.BUNDLE_LOCATION), { recursive: true }, (evt, name) => {
    if (name.indexOf('css') > -1) {
      Object.keys(windows).forEach(win => {
        windows[win].send('main:reload:style', name)
      })
      frameManager.reloadFrames(true, name)
    }
  })
  app.on('ready', () => {
    globalShortcut.register('CommandOrControl+R', () => {
      Object.keys(windows).forEach(win => {
        windows[win].reload()
      })

      frameManager.reloadFrames()
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
  trayReady = true
  if (store('dash.showing')) {
    setTimeout(() => {
      api.showDash()
    }, 300)
  }
})

ipcMain.on('tray:mouseout', () => {
  if (glide && !store('dash.showing')) {
    glide = false
    api.hideTray()
  }
})

// ipcMain.on('tray:focus', () => {
//   if (windows.tray && windows.tray.focus) {
//     // app.focus({ steal: true })
//     windows.tray.focus()
//   }
// })

ipcMain.on('*:contextmenu', (e, x, y) => { if (dev) e.sender.inspectElement(x, y) })


// ipcMain.on('*:installDapp', async (e, domain) => {
//   await dapps.add(domain, {}, err => { if (err) console.error('error adding...', err) })
// })

// ipcMain.on('tray:dappWindow', async (e) => {
//   console.log('tray:dappWindow')
//   // await dapps.add(domain, {}, err => { if (err) console.error('error adding...', err) })
//   // await dapps.launch(domain, console.error)
//   // dapp.createDappFrame(windows)
// })


// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))

// store.observer(_ => api.broadcast('main:action', 'syncMain', store('main')))
// store.observer(_ => api.broadcast('main:action', 'syncDash', store('dash')))
// store.observer(_ => api.broadcast('main:action', 'syncPanel', store('panel')))
store.api.feed((state, actions) => {
  actions.forEach(action => {
    action.updates.forEach(update => {
      api.broadcast('main:action', 'pathSync', update.path, update.value)
    })
  })
})

module.exports = api
