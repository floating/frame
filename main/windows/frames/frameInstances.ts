import { screen, BrowserView, BrowserWindow } from 'electron'
import path from 'path'

import { initWindow } from '../window'
import { topRight } from '../screen'

export interface FrameInstance extends BrowserWindow {
  frameId?: string
  views?: Record<string, BrowserView>
  showingView?: string
}

// TODO: move this to screen
const place = (frameInstance: FrameInstance) => {
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  const height = area.height - 160
  const maxWidth = Math.floor(height * 1.24)
  const targetWidth = area.width - 460
  const width = targetWidth > maxWidth ? maxWidth : targetWidth
  frameInstance.setMinimumSize(400, 300)
  frameInstance.setSize(width, height)
  const pos = topRight(frameInstance)
  frameInstance.setPosition(pos.x - 440, pos.y + 80)
}

export const reposition = (frameInstance: FrameInstance) => {
  place(frameInstance)
}

export const create = (frame: Frame) => {
  const frameInstance: FrameInstance = initWindow('dapp', {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 9 },
    icon: path.join(__dirname, './icons/AppIcon.png')
  })

  frameInstance.on('ready-to-show', () => {
    frameInstance.show()
  })

  frameInstance.showingView = ''
  frameInstance.frameId = frame.id
  frameInstance.views = {}

  place(frameInstance)

  return frameInstance
}
