const { app, ipcMain } = require('electron')
const autoUpdater = require('electron-updater').autoUpdater

const store = require('./store')
const signers = require('./signers')
const windows = require('./windows')
require('./rpc')

// let quit = false

console.log('Chrome: v' + process.versions.chrome)
console.log('Electron: v' + process.versions.electron)
console.log('Node: v' + process.versions.node)

ipcMain.on('addPermission', (e, host, permission) => store.addPermission(host, permission))
ipcMain.on('removePermission', (e, host, permission) => store.removePermission(host, permission))

app.on('ready', () => {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    windows.tray()
  } else {
    setTimeout(windows.tray, 100)
  }
  if (app.dock) app.dock.hide()
})

app.on('activate', () => {
  // quit = false
  windows.activate()
})

app.on('will-quit', e => {
  app.quit()
  // if (!quit) e.preventDefault()
  // if (app.dock) app.dock.hide()
  // setTimeout(() => {
  //   quit = true
  //   app.quit()
  // }, 3000)
})

app.on('quit', signers.close)

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

setTimeout(() => {
  autoUpdater.checkForUpdatesAndNotify()
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 10 * 60 * 1000)
}, 10000)
