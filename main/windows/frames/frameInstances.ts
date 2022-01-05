import electron, { BrowserView, BrowserWindow }  from 'electron'
import path from 'path'

import store from '../../store'

import webPrefrences from '../webPreferences'
import topRight from './topRight'

export interface FrameInstance extends BrowserWindow {
  frameId?: string,
  views?: Record<string, BrowserView>
}

export default {
  create: (frame: Frame) => {
    const area = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()).workArea
    const height = area.height - 160
    const maxWidth = height // Math.floor(height * (16/10))
    const targetWidth = area.width - 460
    const width = targetWidth > maxWidth ? maxWidth : targetWidth
  
    const preload = path.resolve(__dirname, '../../../bundle/bridge.js')
  
    const frameInstance: FrameInstance = new BrowserWindow({
      x: 0,
      y: 0,
      width,
      height,
      show: true,
      frame: false,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 10, y: 9 },
      backgroundColor: store('main.colorwayPrimary', store('main.colorway'), 'background'),
      // backgroundThrottling: false,
      icon: path.join(__dirname, './AppIcon.png'),
      // skipTaskbar: process.platform !== 'linux',
      webPreferences: { ...webPrefrences, preload }
    })
  
    const pos = topRight(frameInstance) 
    frameInstance.setPosition(pos.x - 380, pos.y + 80)
    frameInstance.loadURL(`file://${__dirname}/../../../bundle/dapp.html`)
  
    frameInstance.on('ready-to-show', () => {
      frameInstance.show()
    })
  
    frameInstance.frameId = frame.id
    frameInstance.views = {}

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

    // frameInstance.webContents.openDevTools({ mode: 'detach' })

    return frameInstance
  }
}
