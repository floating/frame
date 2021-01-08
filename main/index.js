const { app, ipcMain, protocol, shell, dialog, clipboard, globalShortcut } = require('electron')
app.commandLine.appendSwitch('enable-accelerated-2d-canvas', true)
app.commandLine.appendSwitch('enable-gpu-rasterization', true)
app.commandLine.appendSwitch('force-gpu-rasterization', true)
app.commandLine.appendSwitch('ignore-gpu-blacklist', true)
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers', true)
app.commandLine.appendSwitch('enable-transparent-visuals', true)
if (process.platform === 'linux') app.commandLine.appendSwitch('disable-gpu', true)

console.log('process.version', process.version)

const log = require('electron-log')
const path = require('path')

const windows = require('./windows')
const menu = require('./menu')
const store = require('./store')

// log.transports.file.level = 'info'

// Action Monitor
// store.api.feed((state, actions, obscount) => {
//   actions.forEach(a => {
//     console.log(a.name)
//     a.updates.forEach(u => {
//       console.log(u.path)
//     })
//   })
// })
const data = require('./data')
const accounts = require('./accounts')
const launch = require('./launch')
const updater = require('./updater')
require('./rpc')
// const clients = require('./clients')
const signers = require('./signers')
const persist = require('./store/persist')

log.info('Chrome: v' + process.versions.chrome)
log.info('Electron: v' + process.versions.electron)
log.info('Node: v' + process.versions.node)

process.on('uncaughtException', (e) => {
  if (e.code === 'EADDRINUSE') {
    dialog.showErrorBox('Frame is already running', 'Frame is already running or another application is using port 1248.')
  } else {
    dialog.showErrorBox('An error occured, Frame will quit', e.message)
  }
  log.error('uncaughtException')
  log.error(e)
  // Kill all clients running as child processes
  // clients.stop()
  throw e
  // setTimeout(() => app.quit(), 50)
})

const externalWhitelist = [
  'https://frame.sh',
  'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf',
  'https://addons.mozilla.org/en-US/firefox/addon/frame-extension',
  'https://github.com/floating/frame/issues/new',
  'https://gitter.im/framehq/general',
  'https://github.com/floating/frame/blob/master/LICENSE',
  'https://aragon.org',
  'https://mainnet.aragon.org',
  'https://rinkeby.aragon.org',
  'https://shop.ledger.com/pages/ledger-nano-x?r=1fb484cde64f',
  'https://shop.trezor.io/?offer_id=10&aff_id=3270',
  'https://discord.gg/UH7NGqY'
]

global.eval = () => { throw new Error(`This app does not support global.eval()`) } // eslint-disable-line

ipcMain.on('tray:resetAllSettings', () => {
  persist.clear()
  if (updater.updatePending) return updater.quitAndInstall(true, true)
  app.relaunch()
  app.exit(0)
})

// ipcMain.on('tray:removeAllAccountsAndSigners', () => {
//   signers.removeAllSigners()
//   accounts.removeAllAccounts()
// })

ipcMain.on('tray:speedTx', async (e, id) => {
  try {
    await accounts.speedTx(id)
  } catch (e) {
    console.log('tray:speedTx Error', e)
  }
})

ipcMain.on('tray:clipboardData', (e, data) => {
  clipboard.writeText(data)
})

ipcMain.on('tray:installAvailableUpdate', (e, install, dontRemind) => {
  updater.installAvailableUpdate(install, dontRemind)
})

ipcMain.on('tray:removeAccount', (e, id) => {
  signers.remove(id)
  accounts.remove(id)
})

ipcMain.on('tray:renameAccount', (e, id, name) => {
  accounts.rename(id, name)
})

ipcMain.on('tray:removeSigner', (e, id) => {
  signers.remove(id)
})

ipcMain.on('tray:openExternal', (e, url) => {
  if (externalWhitelist.indexOf(url) > -1) shell.openExternal(url)
})

ipcMain.on('tray:openExplorer', (e, hash) => {
  const { type, id } = store('main.currentNetwork')
  const explorer = store('main.networks', type, id, 'explorer')
  shell.openExternal(explorer + '/tx/' + hash)
})

ipcMain.on('tray:giveAccess', (e, req, access) => {
  store.giveAccess(req, access)
  accounts.removeRequest(req.handlerId)
})

ipcMain.on('tray:syncPath', (e, path, value) => {
  store.syncPath(path, value)
})

ipcMain.on('tray:ready', () => require('./api'))

ipcMain.on('tray:updateRestart', () => {
  updater.quitAndInstall(true, true)
})

ipcMain.on('tray:refreshMain', () => windows.broadcast('main:action', 'syncMain', store('main')))

// if (process.platform !== 'darwin' && process.platform !== 'win32') app.disableHardwareAcceleration()
app.on('ready', () => {
  menu()
  if (process.platform === 'darwin' || process.platform === 'win32') {
    windows.tray()
  } else {
    setTimeout(windows.tray, 800)
  }
  if (app.dock) app.dock.hide()
  protocol.interceptFileProtocol('file', (req, cb) => {
    const appOrigin = path.resolve(__dirname, '../')
    const filePath = path.resolve(__dirname, req.url.replace(process.platform === 'win32' ? 'file:///' : 'file://', ''))
    if (filePath.startsWith(appOrigin)) cb({path: filePath}) // eslint-disable-line
  })
  store.observer(() => {
    const altSlash = store('main.shortcuts.altSlash')
    if (altSlash) {
      globalShortcut.unregister('Alt+/')
      globalShortcut.register('Alt+/', () => windows.trayClick())
    } else {
      globalShortcut.unregister('Alt+/')
    }
  })
})

ipcMain.on('tray:action', (e, action, ...args) => {
  if (store[action]) return store[action](...args)
  log.info('Tray sent unrecognized action: ', action)
})

app.on('activate', () => windows.activate())
app.on('will-quit', () => app.quit())
app.on('quit', async () => {
  // await clients.stop()
  accounts.close()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

let launchStatus = store('main.launch')
store.observer(() => {
  if (launchStatus !== store('main.launch')) {
    launchStatus = store('main.launch')
    launchStatus ? launch.enable() : launch.disable()
  }
})
