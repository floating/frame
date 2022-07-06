import { shell } from 'electron'
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

const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '') || 60 * 60_000
const useAutoUpdater = isMac || isWindows

class Updater {
  private autoUpdater?: WorkerProcess

  // this will only be set if an upgrade-eligible version is found
  private availableUpdate = ''
  private availableVersion = ''
  private installerReady = false

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
    }, 10_000)
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

  get updateReady () {
    return this.installerReady
  }

  fetchUpdate () {
    if (this.availableUpdate === 'auto') {
      if (!this.autoUpdater) {
        log.warn(`update ${this.availableVersion} is asking to be downloaded but autoUpdater is not running!`)
        return
      }

      log.info(`Downloading update for version ${this.availableVersion}`)

      this.autoUpdater.send('download')
    } else if (this.availableUpdate.startsWith('https')) {
      log.verbose(`Opening release page for version ${this.availableVersion}`)
      shell.openExternal(this.availableUpdate)
    }
  }

  quitAndInstall () {
    if (this.installerReady) {
      if (!this.autoUpdater) {
        log.warn(`update ${this.availableVersion} is asking to be installed but autoUpdater is not running!`)
        return
      }

      log.info(`Quitting, will install ${this.availableVersion} on restart`)

      this.autoUpdater.send('install')
    }
  }

  dismissUpdate () {
    log.verbose('Dismissed update', { version: this.availableVersion })

    if (this.autoUpdater) {
      this.autoUpdater.kill()
    }

    this.availableUpdate = ''
    this.availableVersion = ''
  }

  private updateAvailable (version: string, location: string) {
    log.verbose('Found available update', { version, location, alreadyNotified: this.notified[version] || false })

    if (!this.notified[version]) {
      // a newer version is available

      this.availableVersion = version
      this.availableUpdate = location

      const remindOk = !store('main.updater.dontRemind').includes(version)

      if (remindOk) {
        windows.broadcast('main:action', 'updateBadge', 'updateAvailable', this.availableVersion)
      } else {
        log.verbose(`Update to version ${version} is available but user chose to skip`)
      }

      this.notified[version] = true
    }
  }

  // an update has been downloaded and is ready to be installed
  private readyForInstall () {
    this.installerReady = true

    windows.broadcast('main:action', 'updateBadge', 'updateReady')
  }

  private checkForAutoUpdate () {
    log.debug('Doing automatic check for app update')
  
    this.autoUpdater = new WorkerProcess({
      name: 'auto-updater',
      modulePath: path.resolve(__dirname, 'autoUpdater.js'),
      args: ['--prerelease']
    })
  
    this.autoUpdater.on('update', (update: VersionUpdate) => {
      if (update.availableUpdate) {
        const { version, location } = update.availableUpdate
  
        log.debug('Auto check found available update', { version, location })
  
        this.updateAvailable(version, location)
      } else {
        log.info('No available updates found by auto check, checking manually')
        this.checkForManualUpdate()
      }
    })
  
    this.autoUpdater.on('update-ready', () => {
      log.info('Auto check update ready for install')
  
      if (!this.installerReady) this.readyForInstall()
    })
  
    this.autoUpdater.on('error', (err: string) => {
      this.installerReady = false
  
      log.warn('Error auto checking for update, checking manually', err)
      this.checkForManualUpdate()
    })

    this.autoUpdater.on('exit', () => {
      this.installerReady = false
      this.autoUpdater = undefined
    })
  }
  
  private checkForManualUpdate () {
    log.debug('Checking for app update manually')
  
    const worker = new WorkerProcess({
      name: 'manual-update-checker',
      modulePath: path.resolve(__dirname, 'manualCheck.js'),
      args: ['--prerelease'],
      timeout: 60_000
    })
  
    worker.on('update', (update: VersionUpdate) => {
      if (update.availableUpdate) {
        const { version, location } = update.availableUpdate
  
        log.debug('Manual check found available update', { version, location })
  
        this.updateAvailable(version, location)
      }
    })
  
    worker.on('error', (err: string) => {
      log.warn('Error manually checking for update', err)
    })
  }
}

export default new Updater()
