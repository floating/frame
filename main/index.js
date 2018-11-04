const { app, ipcMain, protocol, shell, dialog } = require('electron')
const PersistStore = require('electron-store')
const log = require('electron-log')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const store = require('./store')
const launch = require('./launch')
const signers = require('./signers')
const windows = require('./windows')
require('./rpc')

const dev = process.env.NODE_ENV === 'development'

log.info('Chrome: v' + process.versions.chrome)
log.info('Electron: v' + process.versions.electron)
log.info('Node: v' + process.versions.node)

let updatePending = false

process.on('uncaughtException', (e) => {
  if (e.code === 'EADDRINUSE') {
    dialog.showErrorBox('Frame is already running', 'Frame is already running or another appication is using port 1248.')
  } else {
    dialog.showErrorBox('An error occured, Frame will quit', e.message)
  }
  log.error(e)
  setTimeout(() => app.quit(), 50)
})

const persist = new PersistStore()

const externalWhitelist = [
  'https://frame.sh',
  'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf',
  'https://github.com/floating/frame/issues/new',
  'https://gitter.im/framehq/general'
]

global.eval = () => { throw new Error(`This app does not support global.eval()`) } // eslint-disable-line

ipcMain.on('tray:resetAllSettings', () => {
  persist.clear()
  if (updatePending) return autoUpdater.quitAndInstall(true, true)
  app.relaunch()
  app.exit(0)
})

ipcMain.on('tray:openExternal', (e, url) => {
  if (externalWhitelist.indexOf(url) > -1) shell.openExternal(url)
})

ipcMain.on('tray:giveAccess', (e, req, access) => {
  store.giveAccess(req, access)
  signers.removeRequest(req.handlerId)
})

ipcMain.on('tray:api', () => require('./api'))

ipcMain.on('tray:updateRestart', () => {
  autoUpdater.quitAndInstall(true, true)
})

ipcMain.on('tray:refreshMain', () => windows.broadcast('main:action', 'syncMain', store('main')))

if (process.platform !== 'darwin' && process.platform !== 'win32') app.disableHardwareAcceleration()
app.on('ready', () => {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    windows.tray()
  } else {
    setTimeout(windows.tray, 20)
  }
  if (app.dock) app.dock.hide()
  protocol.interceptFileProtocol('file', (req, cb) => {
    let appOrigin = path.resolve(__dirname, '../')
    let filePath = path.resolve(__dirname, req.url.replace(process.platform === 'win32' ? 'file:///' : 'file://', ''))
    if (filePath.startsWith(appOrigin)) cb({path: filePath}) // eslint-disable-line
  })
})

ipcMain.on('tray:action', (e, action, ...args) => {
  if (store[action]) return store[action](...args)
  log.info('Tray sent unrecognized action: ', action)
})

app.on('activate', () => windows.activate())
app.on('will-quit', () => app.quit())
app.on('quit', signers.close)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

let launchStatus = store('main.launch')
store.observer(() => {
  if (launchStatus !== store('main.launch')) {
    launchStatus = store('main.launch')
    launchStatus ? launch.enable() : launch.disable()
  }
})

store.observer(_ => persist.set('main', store('main')))

if (!dev) { // Check for updates
  autoUpdater.allowPrerelease = true
  setTimeout(() => {
    autoUpdater.on('error', err => log.error('Auto Update Error: ' + err.message))
    autoUpdater.on('update-downloaded', res => {
      if (!updatePending) windows.broadcast('main:action', 'updateAvailable', res)
      updatePending = true
    })
    autoUpdater.checkForUpdates()
    setInterval(() => {
      autoUpdater.checkForUpdates()
    }, 30 * 60 * 1000)
  }, 10 * 1000)
}
