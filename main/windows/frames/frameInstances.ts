import electron, { BrowserView, BrowserWindow }  from 'electron'
import path from 'path'

import store from '../../store'

import webPreferences from '../webPreferences'
import topRight from './topRight'

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
    const preload = path.resolve(__dirname, (process.env.BUNDLE_LOCATION || ''), 'bridge.js')
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

    frameInstance.loadURL(`file://${process.env.BUNDLE_LOCATION}/dapp.html`)
  
    frameInstance.on('ready-to-show', () => {
      frameInstance.show()
    })
    
    frameInstance.showingView = ''
    frameInstance.frameId = frame.id
    frameInstance.views = {}

    place(frameInstance)

    return frameInstance
  }
}
