const { shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const https = require('https')
const log = require('electron-log')
const semver = require('semver')
const version = require('../../package.json').version
const windows = require('../windows')
const store = require('../store').default

const dev = process.env.NODE_ENV === 'development'

const compareVersions = (a, b) => {
  if (semver.gt(a, b)) return 1
  if (semver.lt(a, b)) return -1
  return 0
}

const checkErr = (err) => log.error('Error checking latest version:', err)
const options = { host: 'api.github.com', path: '/repos/floating/frame/releases', headers: { 'User-Agent': 'request' } }

const prereleaseTrack = true

autoUpdater.allowPrerelease = prereleaseTrack
autoUpdater.autoDownload = false

autoUpdater.on('error', (err) => {
  // TODO: Error Notification
  log.error(' > Auto Update Error: ' + err.message)
  updater.checkManualUpdate()
})

autoUpdater.on('update-available', (r) => {
  //  Ask if they want to download it
  log.info(' > autoUpdated found that an update is available...')
  updater.updateAvailable(r.version, 'auto')
})

autoUpdater.on('update-not-available', () => {
  log.info(' > autoUpdate found no updates, check manually')
  updater.checkManualUpdate()
})

autoUpdater.on('update-downloaded', (res) => {
  if (!updater.updatePending) updater.updateReady()
  updater.updatePending = true
})

const updater = {
  updatePending: false,
  availableUpdate: '',
  availableVersion: '',
  updateAvailable: (version, location) => {
    // An update is available
    this.availableVersion = version
    this.availableUpdate = location
    const remindOk = store('main.updater.dontRemind').indexOf(version) === -1
    if (!updater.notified[version] && remindOk) windows.broadcast('main:action', 'updateBadge', 'updateAvailable')
    updater.notified[version] = true
  },
  updateReady: () => {
    // An update is ready
    windows.broadcast('main:action', 'updateBadge', 'updateReady')
  },
  installAvailableUpdate: (install, dontRemind) => {
    if (dontRemind) store.dontRemind(this.availableVersion)
    if (install) {
      if (this.availableUpdate === 'auto') {
        autoUpdater.downloadUpdate()
      } else if (this.availableUpdate.startsWith('https')) {
        shell.openExternal(this.availableUpdate)
      }
    }
    windows.broadcast('main:action', 'updateBadge', '')
    this.availableUpdate = ''
  },
  quitAndInstall: (...args) => {
    if (updater.updatePending) autoUpdater.quitAndInstall(...args)
  },
  notified: {},
  checkManualUpdate: () => {
    https
      .get(options, (res) => {
        let rawData = ''
        res.on('data', (chunk) => {
          rawData += chunk
        })
        res.on('end', () => {
          try {
            const releases = JSON.parse(rawData).filter((r) => !r.prerelease || prereleaseTrack)
            if (releases && releases[0] && releases[0].tag_name && !updater.notified[releases[0].tag_name]) {
              const newVersion =
                releases[0].tag_name.charAt(0) === 'v' ? releases[0].tag_name.substr(1) : releases[0].tag_name
              if (compareVersions(newVersion, version) === 1) {
                log.info('Updater: Current version is behind latest')
                log.info('Updater: User has not been notified of this version yet')
                log.info('Updater: Notify user')
                updater.updateAvailable(releases[0].tag_name, releases[0].html_url)
              }
            }
          } catch (err) {
            checkErr(err)
          }
        })
      })
      .on('error', checkErr)
  },
}

if (!dev) {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    setTimeout(() => {
      autoUpdater.checkForUpdates()
      setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000)
    }, 10 * 1000)
  } else {
    setTimeout(() => {
      updater.checkManualUpdate()
      setInterval(() => updater.checkManualUpdate(), 60 * 60 * 1000)
    }, 10 * 1000)
  }
}

module.exports = updater
