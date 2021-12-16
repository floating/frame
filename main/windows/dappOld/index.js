const electron = require('electron')
const { BrowserWindow, BrowserView } = electron
const path = require('path')
const crypto = require('crypto')

const store = require('../../store')

const extractColors = require('../extractColors')

const dev = process.env.NODE_ENV === 'development'

const ghostZ = '#cdcde5'

const topRight = (window) => {
  const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
  const screenSize = area
  const windowSize = window.getSize()
  return {
    x: Math.floor(screenSize.x + screenSize.width - windowSize[0]),
    y: screenSize.y
  }
}

const relayerOverlay = (window) => {
  const { overlay } = window
  window.removeBrowserView(overlay)
  window.addBrowserView(overlay)
}

const existingViews = {}

const hideAll = (window, ens, cb) => {
  Object.keys(existingViews).forEach(viewId => {
    window.removeBrowserView(existingViews[viewId])
  })
}

const openDapp = (window, ens, url, cb) => {
  Object.keys(existingViews).forEach(viewId => {
    window.removeBrowserView(existingViews[viewId])
  })

  const id = window.id
  const { width, height } = window.getBounds()

  const viewId = id + ':' + ens //  + ':' + session

  if (existingViews[viewId]) {
    window.addBrowserView(existingViews[viewId])
    existingViews[viewId].setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
    relayerOverlay(window)
  } else {
    existingViews[viewId] = new BrowserView({
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
    window.addBrowserView(existingViews[viewId])
    existingViews[viewId].setBounds({ x: 73, y: 16, width: width - 73, height: height - 16 })
    existingViews[viewId].setAutoResize({ width: true, height: true })

    console.log('URL FOR LOADING DAPP', url)
    existingViews[viewId].webContents.loadURL(url)
    existingViews[viewId].webContents.setVisualZoomLevelLimits(1, 3)
    existingViews[viewId].setBackgroundColor('#fff')
    window.removeBrowserView(existingViews[viewId])
  
    existingViews[viewId].webContents.on('did-finish-load', () => {
      window.addBrowserView(existingViews[viewId])
      relayerOverlay(window)
    })
  }
}

const closeDapp = () => {
  closeDapp()
}

const surface = {
  createDappFrame: (windows) => {
    windows.tray.blur()

    const dappFrameId = crypto.randomBytes(6).toString('hex')

    let existingWindow
    // let dappViews = 0

    // Object.keys(windows).forEach(window => {
    //   if (windows[window].dapp) {
    //     dappViews++
    //     if (windows[window].dapp.ens === ens) {
    //       existingWindow = windows[window]
    //     }
    //   }
    // })

    if (existingWindow) {
      existingWindow.restore()
      existingWindow.focus()
      return
    }

    const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    const height = area.height - 160
    const maxWidth = Math.floor(height * (16/10))
    const width = area.width - 380 - 80  > maxWidth ? maxWidth : area.width - 380 - 80

    windows[dappFrameId] = new BrowserWindow({
      dappFrameId,
      x: 20,
      y: 0,
      width,
      height,
      show: false,
      frame: false,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 9, y: 8 },
      backgroundColor: ghostZ,
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
        preload: path.resolve(__dirname, '../../../bundle/bridge.js')
      }
    })

    // windows[dappFrameId].dapp = { ens}

    // windows[dappFrameId].positioner = new Positioner(windows[dappFrameId])
    const pos = topRight(windows[dappFrameId]) // windows[dappFrameId].positioner.calculate('topRight')
    // const offset = dappViews * 48
    windows[dappFrameId].setPosition(pos.x - 380, pos.y + 80)
    // if (dev) windows[dappFrameId].openDevTools()
    windows[dappFrameId].on('closed', () => { delete windows[dappFrameId] })
    windows[dappFrameId].loadURL(`file://${__dirname}/../../../bundle/dapp.html`)
    // const namehash = hash(ens)

    windows[dappFrameId].webContents.on('did-finish-load', async () => {
      // windows[dappFrameId].webContents.openDevTools()
      // const dapp = Object.assign({}, store(`main.dapp.details.${namehash}`))
      // dapp.url = url
      // dapp.ens = ens
      // dapp.namehash = namehash
      // windows[dappFrameId].send('main:dapp', namehash)
      // store.setDappOpen(ens, true)
    })
    windows[dappFrameId].show()
    windows[dappFrameId].on('closed', () => {
      delete windows[dappFrameId]
      // store.setDappOpen(ens, false)
    })

    windows[dappFrameId].dappFrameId = dappFrameId

    // Add Overlay View
    windows[dappFrameId].overlay = new BrowserView({
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
    windows[dappFrameId].addBrowserView(windows[dappFrameId].overlay)
    windows[dappFrameId].overlay.setBackgroundColor('#0000')
    windows[dappFrameId].overlay.setBounds({ x: 0, y: 0, width, height: 16 })
    windows[dappFrameId].overlay.setAutoResize({ width: true })
    windows[dappFrameId].overlay.webContents.loadURL(`file://${__dirname}/index.html`)
    windows[dappFrameId].removeBrowserView(windows[dappFrameId].overlay)
    windows[dappFrameId].overlay.webContents.on('did-finish-load', () => {
      relayerOverlay(windows[dappFrameId])
      setTimeout(() => relayerOverlay(windows[dappFrameId]), 10)
    })
    return
  




    // const loadApp = hidden => {
    //   const view = new BrowserView({
    //     webPreferences: {
    //       contextIsolation: true,
    //       webviewTag: false,
    //       sandbox: true,
    //       defaultEncoding: 'utf-8',
    //       nativeWindowOpen: true,
    //       nodeIntegration: false
    //       // scrollBounce: true
    //       // navigateOnDragDrop: true
    //     }
    //   })
    //   view.setBackgroundColor('#000')
    //   windows[dappFrameId].setBrowserView(view)
    //   view.setBounds({ x: 68, y: hidden ? height : 0, width: width - 68, height: height - 0 })
    //   view.setAutoResize({ width: true, height: true })
    //   view.webContents.loadURL('https://app.uniswap.org')
    //   view.webContents.showDevTools()
    //   return view
    // }

    // const loadApp = hidden => {
    //   const view = new BrowserView({
    //     webPreferences: {
    //       contextIsolation: true,
    //       webviewTag: false,
    //       sandbox: true,
    //       defaultEncoding: 'utf-8',
    //       nativeWindowOpen: true,
    //       nodeIntegration: false
    //       // scrollBounce: true
    //       // navigateOnDragDrop: true
    //     }
    //   })
    //   view.setBackgroundColor('#000')
    //   windows[dappFrameId].addBrowserView(view)
    //   view.setBounds({ x: 73, y: hidden ? height : 0, width: width - 73, height: height - 0 })
    //   view.setAutoResize({ width: true, height: true })
    //   view.webContents.loadURL('https://app.uniswap.org')
    //   view.webContents.setVisualZoomLevelLimits(1, 3)
    //   return view
    // }

    // const appOverlay = hidden => {
    //   const view2 = new BrowserView({
    //     webPreferences: {
    //       contextIsolation: true,
    //       webviewTag: false,
    //       sandbox: true,
    //       defaultEncoding: 'utf-8',
    //       nativeWindowOpen: true,
    //       nodeIntegration: false
    //       // scrollBounce: true
    //       // navigateOnDragDrop: true
    //     }
    //   })
    //   // view2.setBackgroundColor('#000')
    //   windows[dappFrameId].addBrowserView(view2)
    //   view2.setBackgroundColor('#0000')
    //   view2.setBounds({ x: 0, y: 0, width, height: 16 })
    //   view2.setAutoResize({ width: true })
    //   view2.webContents.loadURL(`file://${__dirname}/index.html`)

    //   view2.webContents.on('did-finish-load', () => {
    //     windows[dappFrameId].removeBrowserView(view2)
    //     windows[dappFrameId].addBrowserView(view2)
    //     setTimeout(() => {
    //       windows[dappFrameId].removeBrowserView(view2)
    //       windows[dappFrameId].addBrowserView(view2)
    //     }, 200)
    //   })  
    //   return view2
    // }

    // const dapp = store(`main.dapp.details.${namehash}`)
    // loadApp()
    // appOverlay()
    // if (dapp.color) return loadApp()

    // // If Frame hasn't collected color data for dapp, do that first
    // let tempView = loadApp(true)
    // tempView.webContents.on('did-finish-load', async () => {
    //   await timeout(200)
    //   const color = await getColor(tempView)
    //   store.updateDapp(namehash, { color })
    //   loadApp()
    //   setTimeout(() => {
    //     // tempView.destroy()
    //     tempView = null
    //   }, 0)
    // })
    // console.log(menu(ens))
    // windows[dappFrameId].setMenu(menu(ens))
    // Menu.setApplicationMenu(menu(ens))
  },
  open: (window, ens, cb) => {
    openDapp(window, ens, cb)
  },
  // install: (ens) => {
  //   installDapp
  // },
  hideAll: (window, cb) => {
    // Set current view of dash in in store
    // hide all views
    hideAll(window, cb)
    

  },
  extractColors
}

module.exports = surface