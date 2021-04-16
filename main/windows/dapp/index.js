const electron = require('electron')
const { BrowserWindow, BrowserView } = electron
const path = require('path')
const { hash } = require('eth-ens-namehash')
const pixels = require('get-pixels')

const store = require('../../store')

const dev = process.env.NODE_ENV === 'development'

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

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const mode = array => {
  if (array.length === 0) return null
  const modeMap = {}
  let maxEl = array[0]; let maxCount = 1
  for (let i = 0; i < array.length; i++) {
    const el = array[i]
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
  const executor = async (resolve, reject) => {
    pixels(image.toPNG(), 'image/png', (err, pixels) => {
      if (err) return reject(err)
      const colors = []
      const width = pixels.shape[0]
      const height = 37
      const depth = pixels.shape[2]
      const limit = width * depth * height
      for (let step = 0; step <= limit; step += depth) {
        const rgb = []
        for (let dive = 0; dive < depth; dive++) rgb.push(pixels.data[step + dive])
        colors.push(`${rgb[0]}, ${rgb[1]}, ${rgb[2]}`)
      }
      const selectedColor = mode(colors)
      const colorArray = selectedColor.split(', ')
      const color = {
        background: `rgb(${selectedColor})`,
        text: textColor(...colorArray)
      }
      resolve(color)
    })
  }
  return new Promise(executor)
}

const getColor = async (view) => {
  const image = await view.webContents.capturePage()
  // fs.writeFile('test.png', image.toPNG(), (err) => {
  //   if (err) throw err
  // })
  const color = await pixelColor(image)
  return color
}

const textColor = (r, g, b) => { // http://alienryderflex.com/hsp.html
  return Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)) > 127.5 ? 'black' : 'white'
}

const surface = {
  openView: (ens, session, windows) => {
    windows.tray.blur()

    let existingWindow
    let dappViews = 0

    Object.keys(windows).forEach(window => {
      if (windows[window].dapp) {
        dappViews++
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
        preload: path.resolve(__dirname, '../../../bundle/bridge.js')
      }
    })

    windows[session].dapp = { ens }

    // windows[session].positioner = new Positioner(windows[session])
    const pos = topRight(windows[session]) // windows[session].positioner.calculate('topRight')
    const offset = dappViews * 48
    windows[session].setPosition(pos.x - 444 - offset, pos.y + 16)
    if (dev) windows[session].openDevTools()
    windows[session].on('closed', () => { delete windows[session] })
    windows[session].loadURL(`file://${__dirname}/../../../bundle/dapp.html`)
    const namehash = hash(ens)

    windows[session].webContents.on('did-finish-load', async () => {
      // windows[session].webContents.openDevTools()
      const dapp = Object.assign({}, store(`main.dapp.details.${namehash}`))
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

    const dapp = store(`main.dapp.details.${namehash}`)
    if (dapp.color) return loadApp()

    // If Frame hasn't collected color data for dapp, do that first
    let tempView = loadApp(true)
    tempView.webContents.on('did-finish-load', async () => {
      await timeout(200)
      const color = await getColor(tempView)
      store.updateDapp(namehash, { color })
      windows[session].send('main:dapp', store(`main.dapp.details.${namehash}`))
      loadApp()
      setTimeout(() => {
        // tempView.destroy()
        tempView = null
      }, 0)
    })
    // console.log(menu(ens))
    // windows[session].setMenu(menu(ens))
    // Menu.setApplicationMenu(menu(ens))
  }
}

module.exports = surface