import { URL } from 'url'
import https, { RequestOptions } from 'https'
import { AppImageUpdater, AppUpdater } from 'electron-updater'
import log from 'electron-log'
import { GitHubProvider } from 'electron-updater/out/providers/GitHubProvider';
import { ProviderRuntimeOptions } from 'electron-updater/out/providers/Provider'

import { addCommand, sendError, sendMessage } from '../worker'
import { IncomingMessage } from 'http';
import { urlToHttpOptions } from 'node:url'

process.on('uncaughtException', sendError)

const isPrereleaseTrack = process.argv.includes('--prerelease')

class CustomProvider extends GitHubProvider {
  constructor (options: any, updater: AppUpdater, runtimeOptions: ProviderRuntimeOptions) {
    super(options, updater, runtimeOptions)

    // @ts-ignore
    this.executor = {
      request: (options) => {
        return this.get(options)
      }
    }
  }

  private get (options: RequestOptions) {
    return new Promise((resolve, reject) => {
      https.get(options, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (res.headers.location) {
            const newUrl = new URL(res.headers.location)
            return resolve(this.get({ ...options, ...urlToHttpOptions(newUrl) }))
          } else {
            return reject(new Error(`redirect with no URL provided, status: ${res.statusCode}, path: ${options.path}`))
          }
        }

        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => resolve(data))
        res.on('error', err => reject(err))
      }).on('error', reject)
    })
  }
}

let autoUpdater: AppUpdater | undefined

addCommand('check', options => {
  const syntheticApp = {
    ...options.app,
    whenReady: () => Promise.resolve()
  }
  
  autoUpdater = new AppImageUpdater({
    provider: 'custom',
    updateProvider: CustomProvider,
    owner: options.owner,
    repo: options.repo
  }, syntheticApp)
  
  autoUpdater.logger = log
  autoUpdater.allowPrerelease = isPrereleaseTrack
  autoUpdater.autoDownload = false
  
  autoUpdater.on('error', sendError)
  
  autoUpdater.on('checking-for-update', () => {
    log.verbose('Performing automatic check for updates', { isPrereleaseTrack })
  })
  
  autoUpdater.on('update-available', res => { //  Ask if they want to download it
    log.debug('Update available', { res })
    sendMessage('update', { availableUpdate: { version: res.version, location: 'auto' } })
  })
  
  autoUpdater.on('update-not-available', res => {
    log.debug('Update not available', { res })
    sendMessage('update', {})
  })
  
  autoUpdater.on('update-downloaded', res => {
    log.debug('Update downloaded', { res })
    sendMessage('update-ready')
  })

  autoUpdater.checkForUpdates()
})

addCommand('download', () => {
  autoUpdater?.downloadUpdate()
})

addCommand('install', () => {
  autoUpdater?.quitAndInstall(true, true)
})

sendMessage('ready')
