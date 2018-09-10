const { app, ipcMain, protocol, shell } = require('electron')
const PersistStore = require('electron-store')
const log = require('electron-log')
const path = require('path')

const store = require('./store')
const signers = require('./signers')
const windows = require('./windows')
require('./rpc')

log.info('Chrome: v' + process.versions.chrome)
log.info('Electron: v' + process.versions.electron)
log.info('Node: v' + process.versions.node)

const persist = new PersistStore()

const unwrap = v => v !== undefined || v !== null ? JSON.parse(v) : v

const externalWhitelist = [
  'https://frame.sh',
  'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf',
  'https://github.com/floating/frame/issues/new',
  'https://gitter.im/framehq/general'
]

global.eval = () => { throw new Error(`This app does not support global.eval()`) } // eslint-disable-line

ipcMain.on('tray:setNetwork', (e, network) => {
  signers.unsetSigner()
  store.setNetwork(unwrap(network))
})

ipcMain.on('tray:resetAllSettings', () => {
  persist.clear()
  app.relaunch()
  app.exit(0)
})

ipcMain.on('tray:openExternal', (e, url) => {
  url = unwrap(url)
  if (externalWhitelist.indexOf(url) > -1) shell.openExternal(url)
})

ipcMain.on('tray:persistLocal', (e, local) => {
  persist.set('local', local)
})

ipcMain.on('tray:setSync', (e, key, payload) => {
  store.setSync(key, payload)
})

ipcMain.on('tray:api', () => require('./api'))

app.on('ready', () => {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    windows.tray()
  } else {
    setTimeout(windows.tray, 100)
  }
  if (app.dock) app.dock.hide()
  protocol.interceptFileProtocol('file', (req, cb) => {
    let appOrigin = path.resolve(__dirname, '../')
    let filePath = path.resolve(__dirname, req.url.replace('file://', ''))
    if (filePath.startsWith(appOrigin)) cb({path: filePath}) // eslint-disable-line
  })
})

app.on('activate', () => windows.activate())
app.on('will-quit', () => app.quit())
app.on('quit', signers.close)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

const autoUpdater = require('electron-updater').autoUpdater
setTimeout(() => {
  autoUpdater.checkForUpdatesAndNotify()
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 10 * 60 * 1000)
}, 10000)

autoUpdater.on('error', message => {
  log.error('There was a problem updating the application')
  log.error(message)
})
