const { app, ipcMain, protocol, shell, dialog } = require('electron')
app.commandLine.appendSwitch('force-gpu-rasterization', true)

const log = require('electron-log')
const path = require('path')
// const bip39 = require('bip39')

const windows = require('./windows')
const store = require('./store')
const launch = require('./launch')
const updater = require('./updater')
require('./rpc')
const signers = require('./signers')
const persist = require('./store/persist')

log.info('Chrome: v' + process.versions.chrome)
log.info('Electron: v' + process.versions.electron)
log.info('Node: v' + process.versions.node)

process.on('uncaughtException', (e) => {
  if (e.code === 'EADDRINUSE') {
    dialog.showErrorBox('Frame is already running', 'Frame is already running or another appication is using port 1248.')
  } else {
    dialog.showErrorBox('An error occured, Frame will quit', e.message)
  }
  log.error('uncaughtException')
  log.error(e)
  throw e
  // setTimeout(() => app.quit(), 50)
})

const externalWhitelist = [
  'https://frame.sh',
  'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf',
  'https://github.com/floating/frame/issues/new',
  'https://gitter.im/framehq/general',
  'https://github.com/floating/frame/blob/master/LICENSE'
]

global.eval = () => { throw new Error(`This app does not support global.eval()`) } // eslint-disable-line

ipcMain.on('tray:resetAllSettings', () => {
  persist.clear()
  if (updater.updatePending) return updater.quitAndInstall(true, true)
  app.relaunch()
  app.exit(0)
})

ipcMain.on('tray:installAvailableUpdate', (e, install, dontRemind) => {
  updater.installAvailableUpdate(install, dontRemind)
})

ipcMain.on('tray:verifyAddress', (e) => {
  signers.verifyAddress(true)
})

ipcMain.on('tray:openExternal', (e, url) => {
  if (externalWhitelist.indexOf(url) > -1) shell.openExternal(url)
})

const networks = { 1: '', 3: 'ropsten.', 4: 'rinkeby.', 42: 'kovan.' }
ipcMain.on('tray:openEtherscan', (e, hash) => {
  let network = networks[store('main.connection.network')]
  shell.openExternal('https://' + network + 'etherscan.io/tx/' + hash)
})

ipcMain.on('tray:giveAccess', (e, req, access) => {
  store.giveAccess(req, access)
  signers.removeRequest(req.handlerId)
})

ipcMain.on('tray:syncPath', (e, path, value) => {
  store.syncPath(path, value)
})

ipcMain.on('tray:ready', () => require('./api'))

ipcMain.on('tray:updateRestart', () => {
  updater.quitAndInstall(true, true)
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

const _accounts = require('./_accounts')
const _signers = require('./_signers')

const mnemonic = 'duck daring trouble employ million bamboo stock seed refuse example glimpse flame'
// const mnemonic = bip39.generateMnemonic()
console.log(mnemonic)
const password = 'frame'

_accounts.on('add', account => {
  log.info('New account added')
  log.info(account)
})

_accounts.on('update', account => {
  log.info('Account updated')
  log.info(account)
})

_accounts.on('remove', account => {
  log.info('Account removed')
  log.info(account)
})

setTimeout(() => {
  _signers.createFromPhrase(mnemonic, password, (err, signer) => {
    if (err) return console.log(err)
    console.log('Created Signer....')
  })
}, 6000)
