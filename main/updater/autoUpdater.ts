import { URL, urlToHttpOptions } from 'url'
import https, { RequestOptions } from 'https'
import log from 'electron-log'

import { AppImageUpdater, AppUpdater, MacUpdater, NsisUpdater } from 'electron-updater'
import { GitHubProvider } from 'electron-updater/out/providers/GitHubProvider'
import { getAppCacheDir } from 'electron-updater/out/AppAdapter'
import { ProviderRuntimeOptions } from 'electron-updater/out/providers/Provider'
import { AllPublishOptions } from 'builder-util-runtime'

import { addCommand, sendError, sendMessage } from '../worker'

process.on('uncaughtException', sendError)

const isPrereleaseTrack = process.argv.includes('--prerelease')

interface AppOptions {
  version: string
  name: string
  isPackaged: boolean
  userDataPath: string
  appUpdateConfigPath: string
}

export interface UpdaterOptions {
  app: AppOptions,
  owner: string,
  repo: string
}

interface SyntheticApp extends AppOptions {
  baseCachePath: string
  whenReady: () => Promise<void>
  quit: () => void
}

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

function createAppUpdater (options: AllPublishOptions, app: any) {
  if (process.platform === "win32") {
    return new NsisUpdater(options, app)
  }

  if (process.platform === "darwin") {
     return new MacUpdater(options, app)
  }

  return new AppImageUpdater(options, app)
}

addCommand('check', async (options: UpdaterOptions) => {
  const syntheticApp: SyntheticApp = {
    ...options.app,
    baseCachePath: getAppCacheDir(),
    whenReady: () => Promise.resolve(),
    quit: () => {
      sendMessage('quit')
    }
  }

  autoUpdater = createAppUpdater({
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

  const result = await autoUpdater.checkForUpdates()

  if (!result) {
    autoUpdater.emit('update-not-available', 'updater is not active')
  }
})

addCommand('download', () => {
  autoUpdater?.downloadUpdate()
})

addCommand('install', () => {
  autoUpdater?.quitAndInstall(true, true)
})

sendMessage('ready')
