// @ts-nocheck

//import { shell } from 'electron'
//import { autoUpdater } from 'electron-updater'
//import log from 'electron-log'

const log = {
  info: console.log,
  warn: console.error,
  error: console.error,
debug: console.log
}

//import windows from '../windows'
import WorkerProcess from '../worker'
//import store from '../store'
import path from 'path'
//import { UpdateCheckResult } from './manualUpdate'

const dev = process.env.NODE_ENV === 'development'



// const checkErr = (err: Error) => log.error('Error checking latest version:', err)
// const options = { host: 'api.github.com', path: '/repos/floating/frame/releases', headers: { 'User-Agent': 'request' } }

// const prereleaseTrack = true

// log.transports.console.level = 'debug'
// autoUpdater.logger = log
// autoUpdater.allowPrerelease = prereleaseTrack
// autoUpdater.autoDownload = false

// autoUpdater.on('checking-for-update', data => {
//   log.error('checking for update!', { data })
// })

// autoUpdater.on('error', err => {
//   updater.updatePending = false
//   // TODO: Error Notification
//   log.error(' > Auto Update Error: ' + err.message)
//   //updater.checkManualUpdate()
// })

// autoUpdater.on('update-available', (r) => { //  Ask if they want to download it
//   log.info(' > autoUpdated found that an update is available...')
//   updater.updateAvailable(r.version, 'auto')
// })

// autoUpdater.on('update-not-available', () => {
//   log.info(' > autoUpdate found no updates, check manually')
//   updater.checkManualUpdate()
// })

// autoUpdater.on('update-downloaded', res => {
//   if (!updater.updatePending) updater.updateReady()
//   updater.updatePending = true
// })

const updater = {
//   updatePending: false,
//   availableUpdate: '',
//   availableVersion: '',
  updateAvailable: (version: string, location: string) => { // An update is available
    this.availableVersion = version
    this.availableUpdate = location
    const remindOk = true // store('main.updater.dontRemind').indexOf(version) === -1
    windows.broadcast('main:action', 'updateBadge', 'updateAvailable')
    updater.notified[version] = true
  },
//   updateReady: () => { // An update is ready
//     windows.broadcast('main:action', 'updateBadge', 'updateReady')
//   },
//   installAvailableUpdate: (install: boolean, dontRemind: boolean) => {
//     if (dontRemind) store.dontRemind(this.availableVersion)
//     if (install) {
//       if (this.availableUpdate === 'auto') {
//         autoUpdater.downloadUpdate()
//       } else if (this.availableUpdate.startsWith('https')) {
//         shell.openExternal(this.availableUpdate)
//       }
//     }
//     windows.broadcast('main:action', 'updateBadge', '')
//     this.availableUpdate = ''
//   },
//   quitAndInstall: (...args: any[]) => {
//     if (updater.updatePending) autoUpdater.quitAndInstall(...args)
//   },
//   notified: {} as Record<string, boolean>
}

function checkForManualUpdate () {
  log.debug('Doing manual check for app update')

  new WorkerProcess({
    name: 'manual-update-checker',
    modulePath: path.resolve(__dirname, 'manualCheck.js'),
    args: ['--prerelease'],
    timeout: 60 * 1000,
    messageHandler: message => {
      if (message.error) {
        return log.warn('Error manually checking for update', message.error)
      }

      const { tagName, htmlUrl } = message.result

      log.info('Manual check found available update', { tagName, htmlUrl })

      if (!updater.notified[tagName]) {
        updater.updateAvailable(tagName, htmlUrl)
      }
    }
  })
}

process.on('uncaughtException', e => console.log('UNCUAGHT IN MAIN!', e))

if (!dev) {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    setTimeout(() => {
      autoUpdater.checkForUpdates()
        setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000)
    }, 10 * 1000)
  } else {
    setTimeout(() => {
      checkForManualUpdate()
      setInterval(() => checkForManualUpdate(), 10 * 1000)
    }, 1 * 1000)
  }
}

export default updater
