import path from 'path'
import log from 'electron-log'
import pixels from 'get-pixels'
import { BrowserWindow, BrowserView } from 'electron'

import webPreferences from '../webPreferences'

function mode (array: string[]) {
  if (array.length === 0) return ''
  const modeMap: Record<string, number> = {}
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

async function pixelColor (image: Electron.NativeImage) {
  return new Promise((resolve, reject) => {
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
        text: textColor(...(colorArray.map(a => parseInt(a)) as [number, number, number]))
      }

      resolve(color)
    })
  })
}

async function getColor (view: BrowserView) {
  const image = await view.webContents.capturePage()
  return pixelColor(image)
}

function textColor (r: number, g: number, b: number) { // http://alienryderflex.com/hsp.html
  return Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b)) > 127.5 ? 'black' : 'white'
}

function extractSession (l: string) {
  const url = new URL(l)
  const session = url.searchParams.get('session') || ''
  const ens = url.port === '8421' ? url.hostname.replace('.localhost', '') || '' : ''
  return { session, ens }
}

async function extractColors (url: string, ens: string) {
  let window: BrowserWindow | null = new BrowserWindow({
    x: 0,
    y: 0,
    width: 800,
    height: 800,
    show: false,
    focusable: false,
    frame: false,
    titleBarStyle: 'hidden',
    paintWhenInitiallyHidden: true,
    webPreferences: { ...webPreferences, backgroundThrottling: false, offscreen: true }
  })

  let view: BrowserView | null = new BrowserView({ 
    webPreferences: { 
      ...webPreferences,
      preload: path.resolve('./main/windows/viewPreload.js') ,
      partition: 'persist:' + ens,
      offscreen: true
    }
  })

  view.webContents.on('will-navigate', e => e.preventDefault())
  view.webContents.on('will-attach-webview', e => e.preventDefault())
  view.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

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

  const { session } = extractSession(url)

  try {
    await view.webContents.session.cookies.set({
      url: url, 
      name: '__frameSession', 
      value: session
    })

    await view.webContents.loadURL(url)

    const color = await getColor(view)

    return color
  } catch (e) {
    log.error(`error extracting colors for ${ens}`, e)
  } finally {
    if (view) {
      const webcontents = (view.webContents as any)
      webcontents.destroy()

      view = null
    }

    if (window) {
      window.destroy()
      window = null
    }
  }
}

export default extractColors
