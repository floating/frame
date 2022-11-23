import electron, { BrowserView, BrowserWindow }  from 'electron'
import path from 'path'

import store from '../../store'

import webPreferences from '../webPreferences'
import topRight from './topRight'

<<<<<<< HEAD
const isDev = process.env.NODE_ENV === 'development'
const enableHMR = isDev && process.env.HMR === 'true'
=======
const enableHMR = process.env.NODE_ENV === 'development' && process.env.HMR === 'true'
>>>>>>> 9a4e8f89 (remove logs, add dev check)

export interface FrameInstance extends BrowserWindow {
  frameId?: string,
  views?: Record<string, BrowserView>,
  showingView?: string
}

const place = (frameInstance: FrameInstance) => {
  const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
  const height = area.height - 160
  const maxWidth = Math.floor(height * 1.24)
  const targetWidth = area.width - 460
  const width = targetWidth > maxWidth ? maxWidth : targetWidth
  frameInstance.setMinimumSize(400, 300)
  frameInstance.setSize(width, height)
  const pos = topRight(frameInstance) 
  frameInstance.setPosition(pos.x - 440, pos.y + 80)
}

export default {
  reposition: (frameInstance: FrameInstance) => {
    place(frameInstance)
  },
  create: (frame: Frame) => {  
<<<<<<< HEAD
<<<<<<< HEAD
    const preload = path.resolve(__dirname, (process.env.BUNDLE_LOCATION || ''), 'bridge.js')
=======
    const preload = process.env.HMR ? 'http://localhost:1234/bridge.js' : path.resolve(__dirname, (process.env.BUNDLE_LOCATION || ''), 'bridge.js')
=======
    const preload = enableHMR ? 'http://localhost:1234/bridge.js' : path.resolve(__dirname, (process.env.BUNDLE_LOCATION || ''), 'bridge.js')
>>>>>>> 9a4e8f89 (remove logs, add dev check)
  
>>>>>>> 57acab1b (first pass at parcel serve + HMR)
    const frameInstance: FrameInstance = new BrowserWindow({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      transparent: process.platform === 'darwin',
      // hasShadow: false,
      show: false,
      frame: false,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 10, y: 9 },
      backgroundColor: store('main.colorwayPrimary', store('main.colorway'), 'background'),
      icon: path.join(__dirname, './AppIcon.png'),
      webPreferences: { ...webPreferences, preload }
    })

<<<<<<< HEAD
<<<<<<< HEAD
    frameInstance.loadURL(enableHMR ? 'http://localhost:1234/dapp/dapp.dev.html' : `file://${process.env.BUNDLE_LOCATION}/dapp.html`)
=======
    frameInstance.loadURL(process.env.HMR ? 'http://localhost:1234/dapp/dapp.html' : `file://${process.env.BUNDLE_LOCATION}/dapp.html`)
>>>>>>> 57acab1b (first pass at parcel serve + HMR)
=======
    frameInstance.loadURL(enableHMR ? 'http://localhost:1234/dapp/dapp.html' : `file://${process.env.BUNDLE_LOCATION}/dapp.html`)
>>>>>>> 9a4e8f89 (remove logs, add dev check)
  
    frameInstance.on('ready-to-show', () => {
      frameInstance.show()
    })
    
    frameInstance.showingView = ''
    frameInstance.frameId = frame.id
    frameInstance.views = {}

    place(frameInstance)

    // Create the frame's overlay view
    // const overlayInstance = new BrowserView({ webPrefrences })
    // frameInstance.addBrowserView(overlayInstance)
    // overlayInstance.setBackgroundColor('#0000')
    // overlayInstance.setBounds({ x: 0, y: 0, width, height })
    // overlayInstance.setAutoResize({ width: true, height: true })
    // overlayInstance.webContents.loadURL(`file://${__dirname}/index.html`)
    // frameInstance.removeBrowserView(windows[dappFrameId].overlay)
    // overlayInstance.webContents.on('did-finish-load', () => {
    //   relayerOverlay(windows[dappFrameId])
    //   setTimeout(() => relayerOverlay(windows[dappFrameId]), 10)
    // })

    if (isDev) {
      frameInstance.webContents.openDevTools({ mode: 'detach' })
    }

    return frameInstance
  }
}
