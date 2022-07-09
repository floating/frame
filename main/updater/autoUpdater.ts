import log from 'electron-log'
import EventEmitter from 'events'

import { AppImageUpdater, AppUpdater, MacUpdater, NsisUpdater } from 'electron-updater'
import { Domain, create as createDomain } from 'domain'

interface VersionInfo {
  version: string
}

function createAppUpdater () {
  if (process.platform === "win32") {
    return new NsisUpdater()
  }

  if (process.platform === "darwin") {
     return new MacUpdater()
  }

  return new AppImageUpdater()
}

export default class AutoUpdater extends EventEmitter {
  private readonly electronAutoUpdater: AppUpdater
  private readonly domain: Domain

  constructor () {
    super()

    this.domain = createDomain()

    this.domain.on('error', err => {
      log.error('Unhandled auto updater error', err)
      this.close()
      this.domain.exit()
    })

    this.electronAutoUpdater = createAppUpdater()
  
    this.electronAutoUpdater.logger = log
    this.electronAutoUpdater.allowPrerelease = false
    this.electronAutoUpdater.autoDownload = false
  
    this.electronAutoUpdater.on('error', err => {
      this.emit('error', err)
    })
  
    this.electronAutoUpdater.on('checking-for-update', () => {
      log.verbose('Performing automatic check for updates', { allowPrerelease: this.electronAutoUpdater.allowPrerelease })
    })
  
    this.electronAutoUpdater.on('update-available', (res: VersionInfo) => {
      log.debug('Auto updater detected update available', { res })
      this.emit('update-available', { version: res.version, location: 'auto' })
    })
  
    this.electronAutoUpdater.on('update-not-available', res => {
      log.debug('Auto updater detected update not available', { res })
      this.emit('update-not-available', res)
    })
  
    this.electronAutoUpdater.on('update-downloaded', res => {
      log.debug('Update downloaded', { res })
      this.emit('update-downloaded')
    })
  }

  close () {
    // TODO: use cancellation token to cancel download
    this.emit('exit')
    this.electronAutoUpdater.removeAllListeners()
  }

  async checkForUpdates () {
    this.domain.run(async () => {
      const result = await this.electronAutoUpdater.checkForUpdates()

      if (!result) {
        this.electronAutoUpdater.emit('update-not-available', 'updater is not active')
      }
    })
  }

  async downloadUpdate () {
    this.electronAutoUpdater.downloadUpdate()
  }

  async quitAndInstall () {
    this.electronAutoUpdater.quitAndInstall()
  }
}
