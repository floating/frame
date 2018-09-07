const { app, ipcMain, protocol } = require('electron')
const log = require('electron-log')
const path = require('path')

const store = require('./store')
const signers = require('./signers')
const windows = require('./windows')
require('./rpc')

console.log('Chrome: v' + process.versions.chrome)
console.log('Electron: v' + process.versions.electron)
console.log('Node: v' + process.versions.node)

global.eval = () => { throw new Error(`This app does not support global.eval()`) } // eslint-disable-line

ipcMain.on('tray:setNetwork', (e, network) => {
  signers.unsetSigner()
  store.setNetwork(network)
})

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
