import { screen, BrowserWindow } from 'electron'
import log from 'electron-log'
import path from 'path'
import { EventEmitter } from 'stream'

import { topRight } from './screen'
import { initWindow } from './window'

const isDev = process.env.NODE_ENV === 'development'
const devToolsEnabled = isDev || process.env.ENABLE_DEV_TOOLS === 'true'
const fullheight = !!process.env.FULL_HEIGHT
const devHeight = 800

export class Onboard extends EventEmitter {
  private window: BrowserWindow

  constructor() {
    super()
    this.window = initWindow('onboard', {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 10, y: 9 },
      icon: path.join(__dirname, './icons/AppIcon.png')
    })
  }

  public hide() {
    if (this.window.isVisible()) {
      this.window.hide()
    }
  }

  public show() {
    // if (!tray.isReady()) {
    //   return
    // }

    setTimeout(() => {
      this.window.once('close', () => {
        this.emit('close')
        this.window.destroy()
      })

      const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const height = (isDev && !fullheight ? devHeight : area.height) - 160
      const maxWidth = Math.floor(height * 1.24)
      const targetWidth = 600 // area.width - 460
      const width = targetWidth > maxWidth ? maxWidth : targetWidth
      this.window.setMinimumSize(600, 300)
      this.window.setSize(width, height)
      const pos = topRight(this.window)
      const x = pos.x - 880
      this.window.setPosition(x, pos.y + 80)
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

  reload() {
    this.window.reload()
  }

  send(channel: string, ...args: string[]) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, ...args)
    } else {
      log.error(new Error(`A window with id "onboard" does not exist (windows.send)`))
    }
  }
}
