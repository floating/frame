import { app as electronApp, BrowserWindow, ipcMain, screen } from 'electron'
import log from 'electron-log'
import path from 'path'
import EventEmitter from 'events'

import store from '../store'
import FrameManager from './frames'
import { clearGlideTimeout, glideIsTriggered, topRight } from './screen'
import { initWindow } from './window'

const events = new EventEmitter()
const frameManager = new FrameManager()
const isDev = process.env.NODE_ENV === 'development'
const devToolsEnabled = isDev || process.env.ENABLE_DEV_TOOLS === 'true'
const fullheight = !!process.env.FULL_HEIGHT
const openedAtLogin =
  electronApp?.getLoginItemSettings() && electronApp.getLoginItemSettings().wasOpenedAtLogin
const trayWidth = 400
const devHeight = 800

export class Tray extends EventEmitter {
  private recentDisplayEvent = false
  private recentDisplayEventTimeout?: NodeJS.Timeout
  private ready = false
  private readyHandler: () => void
  private window: BrowserWindow

  constructor() {
    super()
    this.readyHandler = () => {
      this.ready = true
      this.emit('ready')
    }
    ipcMain.once('tray:ready', this.readyHandler)

    this.window = initWindow('tray', {
      width: trayWidth,
      icon: path.join(__dirname, './icons/AppIcon.png')
    })

    this.window.on('closed', () => this.window.destroy())
    this.window.webContents.session.setPermissionRequestHandler((webContents, permission, res) => res(false))
    this.window.setResizable(false)
    this.window.setMovable(false)
    this.window.setSize(0, 0)

    const { width, height, x, y } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
    this.window.setPosition(width + x, height + y)

    this.window.on('show', () => this.emit('show'))
    this.window.on('hide', () => this.emit('hide'))

    setTimeout(() => {
      this.window.on('focus', () => this.show())
    }, 2000)

    if (devToolsEnabled) {
      this.window.webContents.openDevTools()
    }

    setTimeout(() => {
      this.window.on('blur', () => {
        setTimeout(() => {
          if (this.canAutoHide()) {
            this.hide()
          }
        }, 100)
      })
      this.window.focus()
    }, 1260)

    this.window.once('ready-to-show', () => {
      if (!openedAtLogin) {
        this.show()
      }
    })

    setTimeout(() => {
      screen.on('display-added', () => this.hide())
      screen.on('display-removed', () => this.hide())
      screen.on('display-metrics-changed', () => this.hide())
    }, 30 * 1000)
  }

  isReady() {
    return this.ready
  }

  isVisible() {
    return this.window.isVisible()
  }

  canAutoHide() {
    return store('main.autohide') && !store('windows.dash.showing') && !frameManager.isFrameShowing()
  }

  hide() {
    if (this.recentDisplayEvent || !this.window?.isVisible()) {
      return
    }
    clearTimeout(this.recentDisplayEventTimeout)
    this.recentDisplayEvent = true
    this.recentDisplayEventTimeout = setTimeout(() => {
      this.recentDisplayEvent = false
    }, 150)

    this.window.emit('hide')
    this.window.hide()
    events.emit('tray:hide')
  }

  show() {
    clearGlideTimeout()
    if (this.recentDisplayEvent) {
      return
    }
    clearTimeout(this.recentDisplayEventTimeout)
    this.recentDisplayEvent = true
    this.recentDisplayEventTimeout = setTimeout(() => {
      this.recentDisplayEvent = false
    }, 150)

    // this.window.setPosition(0, 0)
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
    const pos = topRight(this.window)
    this.window.setPosition(pos.x, pos.y)
    if (!glideIsTriggered()) {
      this.window.focus()
    }
    store.trayOpen(true)
    this.window.emit('show')
    this.window.show()
    events.emit('tray:show')
    if (this.window?.focus && !glideIsTriggered()) {
      this.window.focus()
    }
    this.window.setVisibleOnAllWorkspaces(false, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true
    })
  }

  toggle() {
    if (!this.isReady()) return

    this.isVisible() ? this.hide() : this.show()
  }

  focus() {
    this.window.focus()
  }

  destroy() {
    this.emit('destroy')
    ipcMain.off('tray:ready', this.readyHandler)
  }

  reload() {
    this.window.reload()
  }

  send(channel: string, ...args: string[]) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, ...args)
    } else {
      log.error(new Error(`A window with id "tray" does not exist (windows.send)`))
    }
  }

  getBounds() {
    return this.window.getBounds()
  }
}
