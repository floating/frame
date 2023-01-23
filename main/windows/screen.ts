import { screen, BrowserWindow } from 'electron'
import { FrameInstance } from './frames/frameInstances'

let glideTimeout: NodeJS.Timeout
let glideTriggered = false

export const topRight = (window: FrameInstance | BrowserWindow) => {
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  const screenSize = area
  const windowSize = window.getSize()
  return {
    x: Math.floor(screenSize.x + screenSize.width - windowSize[0]),
    y: screenSize.y
  }
}

export const detectMouse = (glideActivatedCallback: () => void) => {
  const m1 = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(m1)
  const area = display.workArea
  const bounds = display.bounds
  const minX = area.width + area.x - 2
  const center = (area.height + (area.y - bounds.y)) / 2
  const margin = (area.height + (area.y - bounds.y)) / 2 - 5
  m1.y = m1.y - area.y
  const minY = center - margin
  const maxY = center + margin
  glideTimeout = setTimeout(() => {
    if (m1.x >= minX && m1.y >= minY && m1.y <= maxY) {
      const m2 = screen.getCursorScreenPoint()
      const area = screen.getDisplayNearestPoint(m2).workArea
      m2.y = m2.y - area.y
      if (m2.x >= minX && m2.y === m1.y) {
        glideTriggered = true
        glideActivatedCallback()
      } else {
        detectMouse(glideActivatedCallback)
      }
    } else {
      detectMouse(glideActivatedCallback)
    }
  }, 50)
}

export const resetGlide = () => {
  glideTriggered = false
}

export const glideIsTriggered = () => glideTriggered

export const clearGlideTimeout = () => clearTimeout(glideTimeout)
