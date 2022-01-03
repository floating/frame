const { BrowserWindow, BrowserView } = require('electron')
const pixels = require('get-pixels')
// const fs = require('fs')

import path from 'path'

import webPreferences from '../webPreferences'

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
        background: `rgb(${colorArray.join(', ')})`, 
        backgroundShade: `rgb(${colorArray.map(v => Math.max(parseInt(v) - 5, 0)).join(', ')})`,
        backgroundLight: `rgb(${colorArray.map(v => Math.min(parseInt(v) + 50, 255)).join(', ')})`,
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

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const extractColors = (url, ens) => {
  let window = new BrowserWindow({
    x: 0,
    y: 0,
    width: 800,
    height: 800,
    show: false,
    focusable: false,
    backgroundThrottling: false,
    frame: false,
    focus: false,
    titleBarStyle: 'hidden',
    paintWhenInitiallyHidden: true,
    webPreferences: {
      webviewTag: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      disableBlinkFeatures: 'Auxclick',
      enableRemoteModule: false,
      offscreen: true
    }
  })

  let view = new BrowserView({ 
    webPreferences: Object.assign({ 
      preload: path.resolve('./main/windows/viewPreload.js') ,
      partition: 'persist:' + ens,
      offscreen: true
    }, webPreferences)
  })

  view.webContents.on('will-navigate', e => e.preventDefault())
  view.webContents.on('will-attach-webview', e => e.preventDefault())
  view.webContents.on('new-window', e => e.preventDefault())

  view.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
    if (!details || !details.frame) return cb({ cancel: true }) // Reject the request

    // Block any dapp requests to Frame during color extraction
    if (details.url.includes('127.0.0.1:1248') || details.url.includes('localhost:1248')) {
      return cb({ cancel: true }) 
    }

    return cb({ requestHeaders: details.requestHeaders }) // Leave untouched
  })

  window.addBrowserView(view)
  view.setBounds({ x: 0, y: 0, width: 800, height: 800 })

  view.webContents.loadURL(url)

  return new Promise((resolve, reject) => {
    view.webContents.on('did-finish-load', async () => {
      await timeout(500)
      const color = await getColor(view)
      view = null
      window = null
      resolve(color)
    })
  })
}

module.exports = extractColors
