const { app, ipcMain } = require('electron')
const log = require('electron-log')

const store = require('./store')
const signers = require('./signers')
const windows = require('./windows')
const services = require('./services')
require('./rpc')

const dev = process.env.NODE_ENV === 'development'
log.transports.file.level = dev ? 'debug' : 'info'

log.debug('Chrome: v' + process.versions.chrome)
log.debug('Electron: v' + process.versions.electron)
log.debug('Node: v' + process.versions.node)

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
  if (app.dock) app.dock.hide() // Hide dock icon
})

app.on('activate', () => {
  windows.activate()
})

app.on('will-quit', e => {
  app.quit()
})

app.on('quit', () => {
  signers.close()
  services.stop()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

if (!dev) {
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
}
