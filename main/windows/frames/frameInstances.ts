import path from 'path'
import electron, { BrowserView, BrowserWindow } from 'electron'

import topRight from './topRight'
import { createWindow } from '../window'

import type { Frame } from '../../store/state/types'

const isDev = process.env.NODE_ENV === 'development'

export interface FrameInstance extends BrowserWindow {
  frameId?: string
  views?: Record<string, BrowserView>
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
    const frameInstance: FrameInstance = createWindow('frameInstance', {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 10, y: 9 },
      icon: path.join(__dirname, './AppIcon.png')
    })

    frameInstance.loadURL(
      isDev ? 'http://localhost:1234/dapp/index.dev.html' : `file://${process.env.BUNDLE_LOCATION}/dapp.html`
    )

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
