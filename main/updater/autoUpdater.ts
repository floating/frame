import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

import { addCommand, sendError, sendMessage } from '../worker'

const isPrereleaseTrack = process.argv.includes('--prerelease')

autoUpdater.logger = log
autoUpdater.allowPrerelease = isPrereleaseTrack
autoUpdater.autoDownload = false

process.on('uncaughtException', sendError)
autoUpdater.on('error', sendError)

autoUpdater.on('checking-for-update', () => {
  log.verbose('Performing automatic check for updates', { isPrereleaseTrack })
})

autoUpdater.on('update-available', r => { //  Ask if they want to download it
  sendMessage('update', { availableUpdate: { version: r.version, location: 'auto' } })
})

autoUpdater.on('update-not-available', () => {
  sendMessage('update', {})
})

autoUpdater.on('update-downloaded', () => {
  sendMessage('update-ready')
})

addCommand('download', () => {
  autoUpdater.downloadUpdate()
})

addCommand('install', () => {
  autoUpdater.quitAndInstall(true, true)
})

autoUpdater.checkForUpdates()
