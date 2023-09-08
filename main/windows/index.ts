import {
  app as electronApp,
  BrowserWindow,
  ipcMain,
  screen,
  globalShortcut,
  IpcMainEvent,
  WebContents,
  Menu
} from 'electron'
import path from 'path'
import log from 'electron-log'
import EventEmitter from 'events'
import { hexToInt } from '../../resources/utils'

import store from '../store'
import WorkspaceManager from './frames'
import { createWindow } from './window'
import { SystemTray, SystemTrayEventHandlers } from './systemTray'
import { registerShortcut } from '../keyboardShortcuts'
import { Shortcut } from '../store/state/types/shortcuts'

type Windows = { [key: string]: BrowserWindow }

const events = new EventEmitter()
const workspaceManager = new WorkspaceManager()
const isDev = process.env.NODE_ENV === 'development'
const devToolsEnabled = isDev || process.env.ENABLE_DEV_TOOLS === 'true'
const fullheight = !!process.env.FULL_HEIGHT
const openedAtLogin =
  electronApp?.getLoginItemSettings() && electronApp.getLoginItemSettings().wasOpenedAtLogin
const windows: Windows = {}
const showOnReady = true
const trayWidth = 400
const devHeight = 800
const isWindows = process.platform === 'win32'
const isMacOS = process.platform === 'darwin'

let tray: Tray
let onboard: Onboard
let notify: Notify
let mouseTimeout: NodeJS.Timeout
let glide = false

const app = {
  hide: () => {
    tray.hide()
  },
  show: () => {
    tray.show()
  },
  toggle: () => {
    const eventName = tray.isVisible() ? 'hide' : 'show'
    app[eventName as keyof typeof app]()
  }
}
const systemTrayEventHandlers: SystemTrayEventHandlers = {
  click: () => {
    if (isWindows) {
      app.toggle()
    }
  },
  clickHide: () => app.hide(),
  clickShow: () => app.show()
}
const systemTray = new SystemTray(systemTrayEventHandlers)

const topRight = (window: BrowserWindow) => {
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  const screenSize = area
  const windowSize = window.getSize()
  return {
    x: Math.floor(screenSize.x + screenSize.width - windowSize[0]),
    y: screenSize.y
  }
}

const center = (window: BrowserWindow) => {
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  const screenSize = area
  const windowSize = window.getSize()
  return {
    x: Math.floor(screenSize.x + screenSize.width / 2 - windowSize[0] / 2),
    y: Math.floor(screenSize.y + screenSize.height / 2 - windowSize[1] / 2)
  }
}

const detectMouse = () => {
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
  mouseTimeout = setTimeout(() => {
    if (m1.x >= minX && m1.y >= minY && m1.y <= maxY) {
      const m2 = screen.getCursorScreenPoint()
      const area = screen.getDisplayNearestPoint(m2).workArea
      m2.y = m2.y - area.y
      if (m2.x >= minX && m2.y === m1.y) {
        glide = true
        app.show()
      } else {
        detectMouse()
      }
    } else {
      detectMouse()
    }
  }, 50)
}

function initWindow(id: string, opts: Electron.BrowserWindowConstructorOptions) {
  // in development, serve files from local filesystem instead of the created bundle
  const url = isDev
    ? `http://localhost:1234/${id}/index.dev.html`
    : new URL(path.join(process.env.BUNDLE_LOCATION, `${id}.html`), 'file:')

  windows[id] = createWindow(id, opts)
  windows[id].loadURL(url.toString())
}

function initTrayWindow() {
  const trayOpts: Electron.BrowserWindowConstructorOptions = {
    width: trayWidth,
    icon: path.join(__dirname, './AppIcon.png'),
    skipTaskbar: process.platform !== 'linux'
  }
  if (isMacOS) {
    trayOpts.type = 'panel'
  }
  initWindow('tray', trayOpts)

  windows.tray.on('closed', () => delete windows.tray)
  windows.tray.webContents.session.setPermissionRequestHandler((webContents, permission, res) => res(false))
  windows.tray.setResizable(false)
  windows.tray.setMovable(false)

  const { width, height, x, y } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  windows.tray.setPosition(width + x, height + y)

  setTimeout(() => {
    windows.tray.on('focus', () => {
      Menu.setApplicationMenu(null)
      if (isMacOS) {
        glide = false
      }
      tray.show()
    })
  }, 2000)

  if (devToolsEnabled) {
    windows.tray.webContents.openDevTools()
  }

  setTimeout(() => {
    windows.tray.on('blur', () => {
      Menu.setApplicationMenu(null)
      setTimeout(() => {
        if (tray.canAutoHide()) {
          tray.hide()
        }
      }, 100)
    })
    windows.tray.focus()
  }, 1260)

  windows.tray.once('ready-to-show', () => {
    if (!openedAtLogin) {
      tray.show()
    }
  })

  // TODO: one of these is causing the tray to hide when workspaces are created and doc/menu items are enabled/disabled
  // setTimeout(() => {
  //   screen.on('display-added', () => tray.hide())
  //   screen.on('display-removed', () => tray.hide())
  //   screen.on('display-metrics-changed', () => tray.hide())
  // }, 30 * 1000)
}

export class Tray {
  private recentDisplayEvent = false
  private recentDisplayEventTimeout?: NodeJS.Timeout
  private gasObserver: Observer
  private ready = false
  private readyHandler: () => void

  constructor() {
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
    this.readyHandler = () => {
      this.ready = true
      systemTray.init(windows.tray)
      if (showOnReady) {
        store.trayOpen(true)
      }

      const showOnboardingWindow = !store('main.mute.onboardingWindow')
      const showNotifyWindow = !store('main.mute.migrateToPylon')

      if (showOnboardingWindow && !showNotifyWindow) {
        setTimeout(() => {
          store.setOnboard({ showing: true })
        }, 600)
      }

      if (showNotifyWindow) {
        setTimeout(() => {
          store.setNotify({ showing: true })
        }, 600)
      }
    }
    ipcMain.once('tray:ready', this.readyHandler)
    initTrayWindow()
  }

  isReady() {
    return this.ready
  }

  isVisible() {
    return (windows.tray as BrowserWindow).isVisible()
  }

  canAutoHide() {
    const autoHideOn = !!store('main.autohide')
    const onboardShowing = !!store('windows.onboard.showing')
    const isFrameShowing = workspaceManager.isFrameShowing()

    log.debug(
      `%ccanAutoHide ${JSON.stringify({ autoHideOn, onboardShowing, isFrameShowing })}`,
      'color: blue'
    )

    return autoHideOn && !onboardShowing && !isFrameShowing
  }

  hide() {
    if (this.recentDisplayEvent || !windows.tray?.isVisible()) {
      return
    }
    clearTimeout(this.recentDisplayEventTimeout)
    this.recentDisplayEvent = true
    this.recentDisplayEventTimeout = setTimeout(() => {
      this.recentDisplayEvent = false
    }, 150)

    store.trayOpen(false)
    if (store('main.reveal')) {
      detectMouse()
    }
    windows.tray.emit('hide')
    windows.tray.hide()
    events.emit('tray:hide')
  }

  public show() {
    clearTimeout(mouseTimeout)
    if (!windows.tray) {
      return init()
    }
    if (this.recentDisplayEvent) {
      return
    }
    clearTimeout(this.recentDisplayEventTimeout)
    this.recentDisplayEvent = true
    this.recentDisplayEventTimeout = setTimeout(() => {
      this.recentDisplayEvent = false
    }, 150)

    if (isMacOS) {
      windows.tray.setPosition(0, 0)
    } else {
      windows.tray.setAlwaysOnTop(true)
    }
    windows.tray.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true
    })
    windows.tray.setResizable(false) // Keeps height consistent
    const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
    const height = isDev && !fullheight ? devHeight : area.height
    windows.tray.setMinimumSize(trayWidth, height)
    windows.tray.setSize(trayWidth, height)
    windows.tray.setMaximumSize(trayWidth, height)
    const pos = topRight(windows.tray)
    windows.tray.setPosition(pos.x, pos.y)
    store.trayOpen(true)
    windows.tray.emit('show')
    if (glide && isMacOS) {
      windows.tray.showInactive()
    } else {
      windows.tray.show()
    }
    events.emit('tray:show')
    if (windows && windows.tray && windows.tray.focus && !glide) {
      windows.tray.focus()
    }
    windows.tray.setVisibleOnAllWorkspaces(false, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true
    })
  }

  toggle() {
    if (!this.isReady()) return

    this.isVisible() ? this.hide() : this.show()
  }

  destroy() {
    this.gasObserver.remove()
    ipcMain.off('tray:ready', this.readyHandler)
  }
}

class Onboard {
  constructor() {
    initWindow('onboard', {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 10, y: 9 },
      icon: path.join(__dirname, './AppIcon.png')
    })
  }

  public hide() {
    if (windows.onboard && windows.onboard.isVisible()) {
      windows.onboard.hide()
    }
  }

  public show() {
    if (!tray.isReady()) {
      return
    }

    const cleanupHandler = () => windows.onboard?.off('close', closeHandler)

    const closeHandler = () => {
      store.completeOnboarding()
      windows.tray.focus()

      electronApp.off('before-quit', cleanupHandler)
      delete windows.onboard
    }

    setTimeout(() => {
      electronApp.on('before-quit', cleanupHandler)
      windows.onboard.once('close', closeHandler)

      const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const height = (isDev && !fullheight ? devHeight : area.height) - 160
      const maxWidth = Math.floor(height * 1.24)
      const targetWidth = 600 // area.width - 460
      const width = targetWidth > maxWidth ? maxWidth : targetWidth
      windows.onboard.setMinimumSize(600, 300)
      windows.onboard.setSize(width, height)
      const pos = topRight(windows.onboard)

      // const x = (pos.x * 2 - width * 2 - 810) / 2
      const x = pos.x - 880
      windows.onboard.setPosition(x, pos.y + 80)
      // windows.onboard.setAlwaysOnTop(true)
      windows.onboard.show()
      windows.onboard.focus()
      windows.onboard.setVisibleOnAllWorkspaces(false, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })
      if (devToolsEnabled) {
        windows.onboard.webContents.openDevTools()
      }
    }, 10)
  }
}

class Notify {
  constructor() {
    const notifyOpts: Electron.BrowserWindowConstructorOptions = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 10, y: 9 },
      icon: path.join(__dirname, './AppIcon.png')
    }

    if (isMacOS) {
      notifyOpts.type = 'panel'
    }

    initWindow('notify', notifyOpts)
  }

  public hide() {
    if (windows.notify && windows.notify.isVisible()) {
      windows.notify.hide()
    }
  }

  public show() {
    if (!tray.isReady()) {
      return
    }

    const cleanupHandler = () => windows.notify?.off('close', closeHandler)

    const closeHandler = () => {
      if (!store('main.mute.migrateToPylon')) {
        store.migrateToPylonConnections()
        store.mutePylonMigrationNotice()
      }

      if (!store('main.mute.onboardingWindow')) {
        store.setNotify({ showing: false })
        store.setOnboard({ showing: true })
      }
      windows.tray.focus()

      electronApp.off('before-quit', cleanupHandler)
      delete windows.notify
    }

    setTimeout(() => {
      electronApp.on('before-quit', cleanupHandler)
      windows.notify.once('close', closeHandler)

      // const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
      const height = 512
      const maxWidth = Math.floor(height * 1.24)
      const targetWidth = 600 // area.width - 460
      const width = targetWidth > maxWidth ? maxWidth : targetWidth
      windows.notify.setMinimumSize(600, 300)
      windows.notify.setSize(width, height)
      const pos = center(windows.notify)
      let x = pos.x - (trayWidth - 10) / 2
      if (store('windows.dash.showing')) {
        const pos = topRight(windows.notify)
        x = pos.x - 880
      }

      windows.notify.setPosition(x, pos.y)
      // windows.onboard.setAlwaysOnTop(true)
      windows.notify.show()
      windows.notify.focus()
      windows.notify.setVisibleOnAllWorkspaces(false, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })
      if (devToolsEnabled) {
        windows.notify.webContents.openDevTools()
      }
    }, 10)
  }
}

ipcMain.on('tray:quit', () => electronApp.quit())
ipcMain.on('tray:mouseout', () => {
  if (glide && !(windows.dash && windows.dash.isVisible())) {
    glide = false
    app.hide()
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
  workspaceManager.start()
})

if (isDev) {
  electronApp.once('ready', () => {
    globalShortcut.register('CommandOrControl+R', () => {
      Object.keys(windows).forEach((win) => {
        windows[win].reload()
      })

      // workspaceManager.reloadFrames()
    })
  })
}

ipcMain.on('*:contextmenu', (e, x, y) => {
  if (isDev) {
    e.sender.inspectElement(x, y)
  }
})

const windowFromWebContents = (webContents: WebContents) =>
  BrowserWindow.fromWebContents(webContents) as BrowserWindow

const init = () => {
  if (tray) {
    tray.destroy()
  }

  tray = new Tray()

  if (!store('main.mute.onboardingWindow')) {
    onboard = new Onboard()
  }

  if (!store('main.mute.migrateToPylon')) {
    notify = new Notify()
  }

  store.observer(() => {
    if (store('windows.onboard.showing')) {
      if (!windows.onboard) {
        onboard = new Onboard()
      }

      onboard.show()
    } else if (onboard) {
      onboard.hide()
      windows.tray.focus()
    }
  }, 'windows:onboard')

  store.observer(() => {
    if (store('windows.notify.showing')) {
      if (!windows.notify) {
        notify = new Notify()
      }

      notify.show()
    } else if (notify) {
      notify.hide()
      windows.tray.focus()
    }
  }, 'windows:notify')

  store.observer(() => broadcast('permissions', JSON.stringify(store('permissions'))))

  store.observer(() => {
    const summonShortcut: Shortcut = store('main.shortcuts.summon')
    const summonHandler = () => {
      app.toggle()
      if (store('windows.onboard.showing')) {
        send('onboard', 'main:flex', 'shortcutActivated')
      }
    }
    systemTray.setSummonShortcut(summonShortcut)

    registerShortcut(summonShortcut, summonHandler)
  })
}

store.observer(() => {
  // Update system tray menu whenever accounts change
  systemTray.setAccounts(Object.values(store('main.accounts')))
  systemTray.setCurrentAccountId(store('selected.current'))
})

const send = (id: string, channel: string, ...args: string[]) => {
  if (windows[id] && !windows[id].isDestroyed()) {
    windows[id].webContents.send(channel, ...args)
  } else {
    log.error(new Error(`A window with id "${id}" does not exist (windows.send)`))
  }
}

const broadcast = (channel: string, ...args: string[]) => {
  Object.keys(windows).forEach((id) => send(id, channel, ...args))
  workspaceManager.broadcast(channel, args)
}

store.api.feed((_state, actions) => {
  broadcast('main:action', 'stateSync', JSON.stringify(actions))
})

export default {
  toggleTray() {
    tray.toggle()
  },
  showTray() {
    tray.show()
  },
  refocusFrame(frameId: string) {
    workspaceManager.refocus(frameId)
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
  init
}
