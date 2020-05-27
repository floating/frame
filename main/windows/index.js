const electron = require('electron')
const { app, shell, BrowserWindow, BrowserView, ipcMain, Tray, Menu, globalShortcut } = electron
const path = require('path')
const fs = require('fs')
const log = require('electron-log')
const { hash } = require('eth-ens-namehash')
const pixels = require('get-pixels')

const store = require('../store')

// const menu = require('./menu')

const dev = process.env.NODE_ENV === 'development'
const winSession = e => e.sender.webContents.browserWindowOptions.session
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
let dockOnly = false
let pinArea

const topRight = (window) => {
  const area = pinArea || electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
  const screenSize = area
  const windowSize = window.getSize()
  return {
    x: Math.floor(screenSize.x + (screenSize.width - (window.isTray && dockOnly ? 70 : windowSize[0]))),
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
  const margin = center - 68
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
        api.showTray(true)
      } else {
        const showing = hideShow.current ? hideShow.current === 'showing' : windows.tray.isVisible()
        if (!showing) detectMouse()
      }
    } else {
      const showing = hideShow.current ? hideShow.current === 'showing' : windows.tray.isVisible()
      if (!showing) detectMouse()
    }
  }, 150)
}

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const mode = array =>  {
  if (array.length === 0) return null
  let modeMap = {}
  let maxEl = array[0], maxCount = 1
  for (let i = 0; i < array.length; i++) {
    let el = array[i]
    if (!modeMap[el]) {
      modeMap[el] = 1
    } else {
      modeMap[el]++
    }
    if (modeMap[el] > maxCount) {
      maxEl = el
      maxCount = modeMap[el]
    }
  }
  return maxEl
}

const pixelColor = image => {
  return new Promise(async (resolve, reject) => {
    pixels(image.toPNG(), 'image/png', (err, pixels) => {
      if (err) return reject(err)
      let colors = []
      let width = pixels.shape[0]
      let height = 37
      let depth = pixels.shape[2]
      let limit = width * depth * height
      for (let step = 0; step <= limit; step += depth) {
        let rgb = []
        for (let dive = 0; dive < depth; dive++) rgb.push(pixels.data[step + dive])
        colors.push(`${rgb[0]}, ${rgb[1]}, ${rgb[2]}`)
      }
      let selectedColor = mode(colors)
      let colorArray = selectedColor.split(', ')
      let color = {
        background: `rgb(${selectedColor})`,
        text: textColor(...colorArray)
      }
      resolve(color)
    })
  })
}

const getColor = async (view) => {
  let image = await view.webContents.capturePage()
  // fs.writeFile('test.png', image.toPNG(), (err) => {
  //   if (err) throw err
  // })
  let color = await pixelColor(image)
  return color
}

const textColor = (r, g, b) => { // http://alienryderflex.com/hsp.html
  return Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)) > 127.5 ? 'black' : 'white'
}

const api = {
  create: () => {
    windows.tray = new BrowserWindow({
      id: 'tray',
      width: 432,
      minWidth: 432,
      frame: false,
      transparent: true,
      hasShadow: false,
      show: false,
      titleBarStyle: 'customButtonsOnHover',
      minimizable: false,
      maximizable: false,
      closable: false,
      backgroundThrottling: false,
      icon: path.join(__dirname, './AppIcon.png'),
      skipTaskbar: process.platform !== 'linux',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        disableBlinkFeatures: 'Auxclick',
        enableRemoteModule: false,
        preload: path.resolve(__dirname, '../../bundle/bridge.js')
      }
    })
    windows.tray.isTray = true
    windows.tray.loadURL(`file://${__dirname}/../../bundle/tray.html`)
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
      windows.tray.on('blur', _ => {
        if (!store('main.pin')) api.hideTray()
      })
      windows.tray.focus()
    }, 1260)
    if (!openedAtLogin) {
      setTimeout(() => {
        if (windows && windows.tray) windows.tray.show()
        setTimeout(() => api.showTray(), process.platform === 'linux' ? 210 : 0)
      }, 50)
    }
    setTimeout(() => {
      electron.screen.on('display-added', () => {
        api.hideTray()
      })
      electron.screen.on('display-removed', () => {
        api.hideTray()
        pinArea = null
      })
      electron.screen.on('display-metrics-changed', () => {
        api.hideTray()
        pinArea = null
      })
      // console.log ('electron.getPosition', windows.tray.getPosition())
      // electron.systemPreferences.subscribeWorkspaceNotification(event, callback) 
      // setInterval(() => {
      //   // console.log(electron.screen.getAllDisplays())
      //   console.log ('electron.getPosition', windows.tray.getPosition())
      // }, 2000)
    }, 10 * 1000)
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
    tray.on('click', api.trayClick)
    api.create()
  },
  trayClick: () => {
    const showing = hideShow.current ? hideShow.current === 'showing' : windows.tray.isVisible()
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
        store.expandDock(false)
        if (windows && windows.tray) {
          if (store('main.reveal')) detectMouse()
          windows.tray.setVisibleOnAllWorkspaces(true)
          windows.tray.setAlwaysOnTop(false)
          const area = pinArea || electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
          // windows.tray.setResizable(true)
          windows.tray.setSize(1, dev ? 740 : area.height)
          const pos = topRight(windows.tray) // windows.tray.positioner.calculate('topRight')
          windows.tray.setPosition(area.width + area.x, pos.y)
          windows.tray.emit('hide')
          windows.tray.hide()
        }
        if (hideShow.next === 'show') setTimeout(() => api.showTray(), 0)
        if (hideShow.next === 'dock') setTimeout(() => api.showTray(true), 0)
        hideShow.running = false
        hideShow.next = false
      }, dockOnly ? 360 : 640)
    }
  },
  showTray: (dock) => {
    dockOnly = dock
    clearTimeout(mouseTimeout)
    hideShow.current = 'showing'
    if (hideShow.running) {
      hideShow.next = false
      if (hideShow.running !== 'show' && hideShow.running !== 'dock') hideShow.next = dock ? 'dock' : 'show'
    } else {
      if (!windows.tray) return api.tray()
      windows.tray.setAlwaysOnTop(true)
      hideShow.running = 'show'
      windows.tray.setVisibleOnAllWorkspaces(true)
      // windows.tray.setResizable(false) // Keeps height consistant
      const area = pinArea || electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
      if (!pinArea && store('main.pin')) pinArea = area
      windows.tray.setSize(dockOnly ? 432 : 432, dev ? 724 : area.height)
      const pos = topRight(windows.tray) // windows.tray.positioner.calculate('topRight')
      windows.tray.setPosition(pos.x, pos.y)
      if (!glide) windows.tray.focus()
      windows.tray.send('main:action', 'trayOpen', true, { dock })
      windows.tray.send('main:action', 'setSignerView', 'default')
      windows.tray.emit('show')
      windows.tray.show()
      setTimeout(() => {
        if (windows && windows.tray && windows.tray.focus && !glide) windows.tray.focus()
        if (hideShow.next === 'hide') setTimeout(() => api.hideTray(), 0)
        hideShow.running = false
        hideShow.next = false
        windows.tray.setVisibleOnAllWorkspaces(false)
      }, 260)
    }
  },
  close: (e) => {
    const id = winSession(e)
    if (windows[id]) {
      windows[id].setClosable(true)
      windows[id].close()
    }
    delete windows[id]
  },
  setWidth: width => {
    const area = pinArea || electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    windows.tray.setSize(width, dev ? 740 : area.height)
    const pos = topRight(windows.tray) // windows.tray.positioner.calculate('topRight')
    windows.tray.setPosition(pos.x, pos.y)
    // windows.tray.setBounds({
    //   width: width,
    //   height: dev ? 740 : area.height,
    //   x: area.width - width,
    //   y: 0
    // })
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
    windows.tray.setClosable(true)
    app.quit()
  },
  reload: () => {
    windows.tray.reload()
  },
  setGlide: (bool) => {
    glide = bool
  },
  openView: (ens, session) => {
    windows.tray.blur()

    let existingWindow
    let dappViews = 0

    Object.keys(windows).forEach(window => {
      if (windows[window].dapp) {
        dappViews ++
        if (windows[window].dapp.ens === ens) {
          existingWindow = windows[window]
        }
      }
    })

    if (existingWindow) {
      existingWindow.restore()
      existingWindow.focus()
      return
    }

    const url = `http://localhost:8421/?dapp=${ens}:${session}`
    const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    const height = area.height - 32
    const width = area.width - 444 > height ? height : area.width - 444

    windows[session] = new BrowserWindow({
      session,
      x: 40,
      y: 0,
      width,
      height,
      show: false,
      frame: false,
      titleBarStyle: 'hiddenInset',
      // minimizable: false,
      // maximizable: false,
      // closable: false,
      // backgroundThrottling: false,
      icon: path.join(__dirname, './AppIcon.png'),
      // skipTaskbar: process.platform !== 'linux',
      webPreferences: {
        webviewTag: false,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        disableBlinkFeatures: 'Auxclick',
        enableRemoteModule: false,
        preload: path.resolve(__dirname, '../../bundle/dapp/bridge.js')
      }
    })

    windows[session].dapp = { ens }
 
    // windows[session].positioner = new Positioner(windows[session])
    const pos = topRight(windows[session]) // windows[session].positioner.calculate('topRight')
    const offset = dappViews * 48
    windows[session].setPosition(pos.x - 444 - offset, pos.y + 16)
    if (dev) windows[session].openDevTools()
    windows[session].on('closed', () => { delete windows[session] })
    windows[session].loadURL(`file://${__dirname}/../../bundle/dapp/dapp.html`)
    let namehash = hash(ens)

    windows[session].webContents.on('did-finish-load', async () => {
      // windows[session].webContents.openDevTools()
      let dapp = Object.assign({}, store(`main.dapp.details.${namehash}`))
      dapp.url = url
      dapp.ens = ens
      windows[session].send('main:dapp', dapp)
      store.setDappOpen(ens, true)
    })
    windows[session].show()
    windows[session].on('closed', () => {
      delete windows[session]
      store.setDappOpen(ens, false)
    })

    const loadApp = hidden => {
      const view = new BrowserView({
        webPreferences: {
          contextIsolation: true,
          webviewTag: false,
          sandbox: true,
          defaultEncoding: 'utf-8',
          nativeWindowOpen: true,
          nodeIntegration: false
          // scrollBounce: true
          // navigateOnDragDrop: true
        }
      })
      windows[session].setBrowserView(view)
      view.setBounds({ x: 0, y: hidden ? height : 37, width, height: height - 37 })
      view.setAutoResize({ width: true, height: true })
      view.webContents.loadURL(url)
      return view
    }

    let dapp = store(`main.dapp.details.${namehash}`)
    if (dapp.color) return loadApp()

    // If Frame hasn't collected color data for dapp, do that first
    const tempView = loadApp(true)
    tempView.webContents.on('did-finish-load', async () => {
      await timeout(200)
      const color = await getColor(tempView)
      store.updateDapp(namehash, { color } )
      windows[session].send('main:dapp', store(`main.dapp.details.${namehash}`))
      loadApp()
      setTimeout(() => {
        tempView.destroy()
        delete tempView
      }, 0)
    })    
    // console.log(menu(ens))
    // windows[session].setMenu(menu(ens))
    // Menu.setApplicationMenu(menu(ens))
  },
  setDockOnly: (bool) => {
    dockOnly = bool
  }
}

app.on('web-contents-created', (e, contents) => {
  contents.on('will-navigate', (e, url) => {
    if (url.startsWith('http://localhost:8421/')) {
      console.log('Navigation -> ', url)
    } else {
      e.preventDefault()
      shell.openExternal(url)
    }
  })
  // contents.on('will-attach-webview', e => e.preventDefault())
  // contents.on('new-window', e => e.preventDefault())
})

if (dev) {
  const path = require('path')
  const watch = require('node-watch')
  watch(path.resolve(__dirname, '../../', 'bundle'), { recursive: true }, (evt, name) => {
    if (name.indexOf('css') > -1) {
      Object.keys(windows).forEach(id => {
        windows[id].send('main:reload:style', name)
      })
    }
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

ipcMain.on('tray:pin', () => {
  if (store('main.pin')) {
    pinArea = null
    setTimeout(() => api.hideTray(), 200)
  } else {
    pinArea = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
  }
  store.pin()
})
ipcMain.on('tray:expand', () => {
  glide = false
  const showing = hideShow.current ? hideShow.current === 'showing' : windows.tray.isVisible()
  showing && !dockOnly ? api.hideTray() : api.showTray()
})

ipcMain.on('tray:mouseout', () => {
  if (glide) {
    glide = false
    api.hideTray()
  }
})

ipcMain.on('window:close', api.close)

// ipcMain.on('window:show', e => {
//   const session = winSession(e)
//   if (windows[session]) windows[session].show()
// })

ipcMain.on('tray:contextmenu', (e, x, y) => { if (dev) windows.tray.inspectElement(x, y) })

// Data Change Events
store.observer(_ => api.broadcast('permissions', JSON.stringify(store('permissions'))))
// store.observer(_ => api.broadcast('main:action', 'app', store('main')))

// Sync all state changes to every window
store.api.feed((state, actions, obscount) => {
  actions.forEach(action => {
    action.updates.forEach(update => {
      // if (update.path.startsWith('main')) return
      // console.log('State Update >>>', update.path, '===', update.value)
      const base = update.path.split('.')[0]
      if (['main', 'dock'].indexOf(base) > -1) { // Soon to be all?
        api.broadcast('main:action', 'sync', update.path, update.value)
      }
    })
  })
})

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+,', () => {
    api.showTray()
  })

  globalShortcut.register('CommandOrControl+.', () => {
    api.hideTray()
  })
})

module.exports = api
