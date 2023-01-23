import {
  app as electronApp,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  IpcMainEvent,
  WebContents
} from 'electron'

import store from '../store'
import FrameManager from './frames'
import { SystemTray, SystemTrayEventHandlers } from './systemTray'
import { Tray } from './tray'
import { Dash } from './dash'
import { Onboard } from './onboard'
import { hexToInt } from '../../resources/utils'
import { detectMouse, glideIsTriggered, resetGlide } from './screen'

const frameManager = new FrameManager()
const isDev = process.env.NODE_ENV === 'development'
const isWindows = process.platform === 'win32'
const showOnReady = true
let manager: WindowManager

class WindowManager {
  private tray: Tray
  private dash: Dash
  private onboard?: Onboard
  private gasObserver: Observer

  constructor() {
    // if (this.tray) {
    //   this.tray.destroy()
    // }

    this.gasObserver = store.observer(() => {
      let title = ''
      if (store('platform') === 'darwin' && store('main.menubarGasPrice')) {
        const gasPrice = store('main.networksMeta.ethereum', 1, 'gas.price.levels.fast')
        if (!gasPrice) return
        const gasDisplay = Math.round(hexToInt(gasPrice) / 1000000000).toString()
        title = gasDisplay // ɢ 🄶 Ⓖ ᴳᵂᴱᴵ
      }
      systemTray.setTitle(title)
    })

    this.tray = new Tray()
    this.dash = new Dash()

    if (!store('main.mute.onboardingWindow')) {
      this.onboard = new Onboard()
      this.onboard.on('close', () => {
        store.completeOnboarding()
        this.tray.focus()
      })
    }

    this.tray.once('ready', () => {
      systemTray.init(this.tray)
      systemTray.setContextMenu('hide', { displaySummonShortcut: getDisplaySummonShortcut() })
      if (showOnReady) {
        store.trayOpen(true)
      }

      const showOnboardingWindow = !store('main.mute.onboardingWindow')
      if (store('windows.dash.showing') || showOnboardingWindow) {
        setTimeout(() => {
          this.dash.show()
        }, 300)
      }

      if (showOnboardingWindow) {
        setTimeout(() => {
          this.onboard?.show()
        }, 600)
      }
    })

    this.tray.once('destroy', () => this.gasObserver.remove())
    this.tray.on('show', () => {
      if (process.platform === 'win32') {
        systemTray.closeContextMenu()
      }
      systemTray.setContextMenu('hide', { displaySummonShortcut: getDisplaySummonShortcut() })
    })
    this.tray.on('hide', () => {
      if (process.platform === 'win32') {
        systemTray.closeContextMenu()
      }
      systemTray.setContextMenu('show', { displaySummonShortcut: getDisplaySummonShortcut() })

      store.toggleDash('hide')
      store.trayOpen(false)
      if (store('main.reveal')) {
        detectMouse(() => this.tray.show())
      }
    })

    // data change events
    store.observer(() => {
      if (store('windows.dash.showing')) {
        this.dash.show()
      } else {
        this.dash.hide()
        this.tray.focus()
      }
    })

    store.observer(() => broadcast('permissions', JSON.stringify(store('permissions'))))
    store.observer(() => {
      const displaySummonShortcut = store('main.shortcuts.altSlash')
      if (displaySummonShortcut) {
        globalShortcut.unregister('Alt+/')
        globalShortcut.register('Alt+/', () => {
          manager.toggle()
          if (!store('main.mute.onboardingWindow')) {
            this.onboard?.send('main:flex', 'shortcutActivated')
          }
        })
      } else {
        globalShortcut.unregister('Alt+/')
      }
      if (this.tray?.isReady()) {
        systemTray.setContextMenu(this.tray.isVisible() ? 'hide' : 'show', { displaySummonShortcut })
      }
    })
  }

  hide() {
    this.tray.hide()
    if (this.dash.isVisible()) {
      this.dash.hide('app')
    }
  }

  show() {
    // if (!this.window) {
    //   return init()
    // }
    this.tray.show()
    if (this.dash.hiddenByAppHide || this.dash.isVisible()) {
      this.dash.show()
    }
  }

  toggle() {
    const eventName = this.tray.isVisible() ? 'hide' : 'show'
    this[eventName]()
  }

  reload() {
    this.tray.reload()
    this.dash.reload()
    this.onboard?.reload()
  }

  broadcast(channel: string, ...args: string[]) {
    this.tray.send(channel, ...args)
    this.dash.send(channel, ...args)
    this.onboard?.send(channel, ...args)
  }
}

const systemTrayEventHandlers: SystemTrayEventHandlers = {
  click: () => {
    if (isWindows) {
      manager.toggle()
    }
  },
  clickHide: () => manager.hide(),
  clickShow: () => manager.show()
}
const systemTray = new SystemTray(systemTrayEventHandlers)
const getDisplaySummonShortcut = () => store('main.shortcuts.altSlash')

ipcMain.on('tray:quit', () => electronApp.quit())
ipcMain.on('tray:mouseout', () => {
  if (glideIsTriggered() && !store('windows.dash.showing')) {
    resetGlide()
    manager.hide()
  }
})

// deny navigation, webview attachment & new windows on creation of webContents
// also set elsewhere but enforced globally here to minimize possible vectors of attack
// - in the case of e.g. dependency injection
// - as a 'to be sure' against possibility of misconfiguration in the future
electronApp.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (e) => e.preventDefault())
  contents.on('will-attach-webview', (e) => e.preventDefault())
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
})

electronApp.on('ready', () => {
  frameManager.start()
})

if (isDev) {
  electronApp.once('ready', () => {
    globalShortcut.register('CommandOrControl+R', () => manager.reload())
  })
}

ipcMain.on('*:contextmenu', (e, x, y) => {
  if (isDev) {
    e.sender.inspectElement(x, y)
  }
})

const windowFromWebContents = (webContents: WebContents) =>
  BrowserWindow.fromWebContents(webContents) as BrowserWindow

const broadcast = (channel: string, ...args: string[]) => {
  manager?.broadcast(channel, ...args)
  frameManager.broadcast(channel, args)
}

store.api.feed((_state, actions) => {
  broadcast('main:action', 'stateSync', JSON.stringify(actions))
})

export default {
  // TODO: rename to toggleApp / showApp?
  toggleTray() {
    manager.toggle()
  },
  showTray() {
    manager.show()
  },
  refocusFrame(frameId: string) {
    frameManager.refocus(frameId)
  },
  close(e: IpcMainEvent) {
    windowFromWebContents(e.sender).close()
  },
  max(e: IpcMainEvent) {
    windowFromWebContents(e.sender).maximize()
  },
  unmax(e: IpcMainEvent) {
    windowFromWebContents(e.sender).unmaximize()
  },
  min(e: IpcMainEvent) {
    windowFromWebContents(e.sender).minimize()
  },
  init() {
    manager = new WindowManager()
  }
}
