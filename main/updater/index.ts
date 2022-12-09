import log from 'electron-log'

import store from '../store'
import { openExternal } from '../windows/window'
import AutoUpdater from './autoUpdater'
import manualCheck from './manualCheck'

export interface VersionUpdate {
  version: string
  location: string
}

const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '') || 60 * 60_000
const useAutoUpdater = isMac || isWindows

class Updater {
  private autoUpdater?: AutoUpdater

  // this will only be set if an upgrade-eligible version is found
  private availableUpdate = ''
  private availableVersion = ''
  private installerReady = false

  private setupCheck?: NodeJS.Timeout
  private pendingCheck?: NodeJS.Timeout
  private notified: Record<string, boolean> = {}

  start() {
    log.verbose('Starting updater', { useAutoUpdater })

    this.stopUpdates()

    const check = useAutoUpdater ? () => this.checkForAutoUpdate() : () => this.checkForManualUpdate()

    this.setupCheck = setTimeout(() => {
      check()
      this.pendingCheck = setInterval(check, UPDATE_INTERVAL)
    }, 10_000)
  }

  stop() {
    log.verbose('Stopping updater')

    this.stopUpdates()
  }

  get updateReady() {
    return this.installerReady
  }

  fetchUpdate() {
    if (this.availableUpdate === 'auto') {
      if (!this.autoUpdater) {
        log.warn(`update ${this.availableVersion} is asking to be downloaded but autoUpdater is not running!`)
        return
      }

      log.info(`Downloading update for version ${this.availableVersion}`)

      this.autoUpdater.downloadUpdate()
    } else if (this.availableUpdate.startsWith('https')) {
      log.verbose(`Opening release page for version ${this.availableVersion}`)
      openExternal(this.availableUpdate)
    }
  }

  quitAndInstall() {
    if (this.installerReady) {
      if (!this.autoUpdater) {
        log.warn(`update ${this.availableVersion} is asking to be installed but autoUpdater is not running!`)
        return
      }

      log.info(`Quitting, will install ${this.availableVersion} on restart`)

      this.autoUpdater.quitAndInstall()
    }
  }

  dismissUpdate() {
    log.verbose('Dismissed update', { version: this.availableVersion })

    this.availableUpdate = ''
    this.availableVersion = ''
  }

  private stopUpdates() {
    if (this.setupCheck) {
      clearTimeout(this.setupCheck)
      this.setupCheck = undefined
    }

    if (this.pendingCheck) {
      clearInterval(this.pendingCheck)
      this.pendingCheck = undefined
    }

    if (this.autoUpdater) {
      this.autoUpdater.close()
      this.autoUpdater = undefined
    }
  }

  private updateAvailable(version: string, location: string) {
    log.verbose('Found available update', {
      version,
      location,
      alreadyNotified: this.notified[version] || false
    })

    if (!this.notified[version]) {
      // a newer version is available

      this.availableVersion = version
      this.availableUpdate = location

      const remindOk = !store('main.updater.dontRemind').includes(version)

      if (remindOk) {
        store.updateBadge('updateAvailable', this.availableVersion)
      } else {
        log.verbose(`Update to version ${version} is available but user chose to skip`)
      }

      this.notified[version] = true
    }
  }

  // an update has been downloaded and is ready to be installed
  private readyForInstall() {
    this.installerReady = true

    store.updateBadge('updateReady')
  }

  private checkForAutoUpdate() {
    log.debug('Doing automatic check for app update')

    const switchToManualUpdate = () => {
      this.dismissUpdate()
      this.checkForManualUpdate()
    }

    if (!this.autoUpdater) {
      this.autoUpdater = new AutoUpdater()

      this.autoUpdater.on('update-available', (update: VersionUpdate) => {
        const { version, location } = update

        log.info('Auto check found available update', { version, location })

        this.updateAvailable(version, location)
      })

      this.autoUpdater.on('update-not-available', () => {
        log.info('No available updates found by auto check, checking manually')
        switchToManualUpdate()
      })

      this.autoUpdater.on('update-downloaded', () => {
        log.info('Auto check update downloaded and ready for install')

        if (!this.installerReady) this.readyForInstall()
      })

      this.autoUpdater.on('error', (err: Error) => {
        this.installerReady = false

        log.warn('Error auto checking for update, checking manually', err)
        switchToManualUpdate()
      })

      this.autoUpdater.on('exit', () => {
        log.verbose('Auto updater exited')
        this.autoUpdater = undefined
      })
    }

    this.autoUpdater.checkForUpdates()
  }

  private async checkForManualUpdate() {
    log.debug('Checking for app update manually')

    try {
      const update = await manualCheck({ prereleaseTrack: false })

      if (!update) {
        log.info('Manual check found no updates')
      } else {
        const { version, location } = update
        log.debug('Manual check found available update', { version, location })

        this.updateAvailable(version, location)
      }
    } catch (e) {
      log.error('Error performing manual check for updates', e)
    }
  }
}

export default new Updater()
