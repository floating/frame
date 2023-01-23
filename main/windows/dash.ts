import { BrowserWindow, screen } from 'electron'
import log from 'electron-log'
import { EventEmitter } from 'stream'

import { topRight } from './screen'
import { initWindow } from './window'

const isDev = process.env.NODE_ENV === 'development'
const devToolsEnabled = isDev || process.env.ENABLE_DEV_TOOLS === 'true'
const fullheight = !!process.env.FULL_HEIGHT
const trayWidth = 400
const devHeight = 800

export class Dash extends EventEmitter {
  private recentDisplayEvent = false
  private recentDisplayEventTimeout?: NodeJS.Timeout
  private window: BrowserWindow
  public hiddenByAppHide = false

  constructor() {
    super()
    this.window = initWindow('dash', {
      width: trayWidth
    })
  }

  public hide(context?: string) {
    if (this.recentDisplayEvent || !this.window.isVisible()) {
      return
    }
    if (context === 'app') {
      this.hiddenByAppHide = true
    }
    clearTimeout(this.recentDisplayEventTimeout)
    this.recentDisplayEvent = true
    this.recentDisplayEventTimeout = setTimeout(() => {
      this.recentDisplayEvent = false
    }, 150)
    this.window.hide()
  }

  public show() {
    if (this.recentDisplayEvent) {
      return
    }
    if (this.hiddenByAppHide) {
      this.hiddenByAppHide = false
    }
    clearTimeout(this.recentDisplayEventTimeout)
    this.recentDisplayEvent = true
    this.recentDisplayEventTimeout = setTimeout(() => {
      this.recentDisplayEvent = false
    }, 150)
    setTimeout(() => {
      this.window.setAlwaysOnTop(true)
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })
      this.window.setResizable(false) // Keeps height consistent
      const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const height = isDev && !fullheight ? devHeight : area.height
      this.window.setMinimumSize(trayWidth, height)
      this.window.setSize(trayWidth, height)
      this.window.setMaximumSize(trayWidth, height)
      const { x, y } = topRight(this.window)
      this.window.setPosition(x - trayWidth - 5, y)
      this.window.show()
      this.window.focus()
      this.window.setVisibleOnAllWorkspaces(false, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })
      if (devToolsEnabled) {
        this.window.webContents.openDevTools()
      }
    }, 10)
  }

  isVisible() {
    return this.window.isVisible()
  }

  reload() {
    this.window.reload()
  }

  send(channel: string, ...args: string[]) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, ...args)
    } else {
      log.error(new Error(`A window with id "dash" does not exist (windows.send)`))
    }
  }
}
