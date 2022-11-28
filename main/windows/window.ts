import { BrowserWindow, BrowserView, BrowserWindowConstructorOptions } from 'electron'
import log from 'electron-log'
import path from 'path'

import store from '../store'

export function createWindow (name: string, opts?: BrowserWindowConstructorOptions, webPreferences: BrowserWindowConstructorOptions['webPreferences'] = {}) {
  log.verbose(`Creating ${name} window`)

  const browserWindow = new BrowserWindow({ 
    ...opts,
    frame: false,
    transparent: process.platform === 'darwin',
    show: false,
    backgroundColor: store('main.colorwayPrimary', store('main.colorway'), 'background'),
    skipTaskbar: process.platform !== 'linux',
    webPreferences: {
      ...webPreferences,
      preload: path.resolve(process.env.BUNDLE_LOCATION, 'bridge.js'),
      backgroundThrottling: false, // Allows repaint when window is hidden
      contextIsolation: true,
      webviewTag: false,
      sandbox: true,
      defaultEncoding: 'utf-8',
      nodeIntegration: false,
      scrollBounce: true,
      navigateOnDragDrop: false,
      disableBlinkFeatures: 'Auxclick'
    } 
  })

  browserWindow.webContents.once('did-finish-load', () => {
    log.info(`Created ${name} renderer process, pid:`, browserWindow.webContents.getOSProcessId())
  })

  return browserWindow
}

export function createViewInstance (ens = '') {
  const viewInstance = new BrowserView({ 
    webPreferences: {
      contextIsolation: true,
      webviewTag: false,
      sandbox: true,
      defaultEncoding: 'utf-8',
      nodeIntegration: false,
      scrollBounce: true,
      navigateOnDragDrop: false,
      disableBlinkFeatures: 'Auxclick',
      preload: path.resolve('./main/windows/viewPreload.js'),
      partition: `persist:${ens}`
    }
  })

  viewInstance.webContents.on('will-navigate', (e) => e.preventDefault())
  viewInstance.webContents.on('will-attach-webview', (e) => e.preventDefault())
  viewInstance.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  return viewInstance
}
