
import { shell, powerMonitor } from 'electron'
import log from 'electron-log'
import path from 'path'

import store from '../store'
import windows from '../windows'
import WorkerProcess from '../worker/process'

export interface VersionUpdate {
  availableUpdate?: {
    version: string
    location: string
  }
}

function isMac () {
  return process.platform === 'darwin'
}

function isWindows () {
  return process.platform === 'win32'
}

const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '') || 60 * 60 * 1000
const useAutoUpdater = true || isMac() || isWindows()

class Updater {
  updatePending = false

  private autoUpdater?: WorkerProcess

  // this will only be set if an upgrade-eligible version is found
  private availableUpdate = ''
  private availableVersion = ''

  private pendingCheck?: NodeJS.Timeout
  private notified: Record<string, boolean> = {}

  start () {
    log.verbose('Starting updater', { useAutoUpdater })

    this.stop()

    const check = useAutoUpdater 
      ? () => {
          if (!this.autoUpdater) {
            // previous auto update cycle has completed so the worker process exited, start a new one,
            // otherwise previous auto update cycle is still in progress so don't start a new one
            this.checkForAutoUpdate()
          }
        }
      : () => this.checkForManualUpdate()

    setTimeout(() => {
      check()
      this.pendingCheck = setInterval(check, UPDATE_INTERVAL)
    }, 4 * 1000)
  }

  stop () {
    log.verbose('Stopping updater')

    if (this.pendingCheck) {
      this.pendingCheck = undefined
      clearTimeout(this.pendingCheck)
    }

    if (this.autoUpdater) {
      this.autoUpdater.kill()
    }
  }

  checkForAutoUpdate () {
    log.debug('Doing automatic check for app update')
  
    this.autoUpdater = new WorkerProcess({
      name: 'auto-updater',
      modulePath: path.resolve(__dirname, 'autoUpdater.js'),
      args: ['--prerelease']
    })
  
    this.autoUpdater.on('update', (update: VersionUpdate) => {
      if (update.availableUpdate) {
        const { version, location } = update.availableUpdate
  
        log.info('Auto check found available update', { version, location })
  
        updater.updateAvailable(version, location)
      } else {
        log.info('No available updates found by auto check, checking manually')
        this.checkForManualUpdate()
      }
    })
  
    this.autoUpdater.on('update-ready', () => {
      log.info('Auto check update ready for install')
  
      if (!updater.updatePending) updater.updateReady()
    })
  
    this.autoUpdater.on('error', (err: string) => {
      updater.updatePending = false
  
      log.warn('Error auto checking for update, checking manually', err)
      this.checkForManualUpdate()
    })

    this.autoUpdater.on('exit', () => {
      this.autoUpdater = undefined
    })
  }
  
  checkForManualUpdate () {
    log.debug('Checking for app update manually')
  
    const worker = new WorkerProcess({
      name: 'manual-update-checker',
      modulePath: path.resolve(__dirname, 'manualCheck.js'),
      args: ['--prerelease'],
      timeout: 60 * 1000
    })
  
    worker.on('update', (update: VersionUpdate) => {
      if (update.availableUpdate) {
        const { version, location } = update.availableUpdate
  
        log.info('Manual check found available update', { version, location })
  
        updater.updateAvailable(version, location)
      }
    })
  
    worker.on('error', (err: string) => {
      log.warn('Error manually checking for update', err)
    })
  }

  updateAvailable (version: string, location: string) {
    if (!this.notified[version]) {
      // a newer version is available
  
      this.availableVersion = version
      this.availableUpdate = location
  
      const remindOk = store('main.updater.dontRemind').indexOf(version) === -1

      if (remindOk) {
        windows.broadcast('main:action', 'updateBadge', 'updateAvailable')
      }

      this.notified[version] = true
    }
  }

  updateReady () {
    // an update is ready to be installed
    windows.broadcast('main:action', 'updateBadge', 'updateReady')

    this.updatePending = true
  }

  installUpdate () {
    if (this.availableUpdate === 'auto') {
      if (!this.autoUpdater) {
        log.warn(`update ${this.availableVersion} is asking to be downloaded but autoUpdater is not running!`)
        return
      }

      this.autoUpdater.send('download')
    } else if (this.availableUpdate.startsWith('https')) {
      shell.openExternal(this.availableUpdate)
    }
  }

  dismissUpdate (remind = false) {
    if (!remind) {
      store.dontRemind(this.availableVersion)
    }

    // close the update panel
    windows.broadcast('main:action', 'updateBadge', '')

    this.availableUpdate = ''
  }

  quitAndInstall () {
    if (this.updatePending) {
      if (!this.autoUpdater) {
        log.warn(`update ${this.availableVersion} is asking to be installed but autoUpdater is not running!`)
        return
      }

      this.autoUpdater.send('install')
    }
  }
}

const updater = new Updater()

if (process.env.NODE_ENV !== 'development') {
  powerMonitor.on('resume', () => {
    log.debug('System resuming, starting updater')

    updater.start()
  })

  powerMonitor.on('suspend', () => {
    log.debug('System suspending, stopping updater')

    updater.stop()
  })

  updater.start()
}

export default updater
