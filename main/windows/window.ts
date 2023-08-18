import { BrowserWindow, BrowserView, BrowserWindowConstructorOptions, shell } from 'electron'
import log from 'electron-log'
import path from 'path'
import { COLORWAY_SKINS } from '../../resources/constants'

import store from '../store'

import type { ChainId } from '../store/state'

type OpenExplorer = {
  chain: {
    id: number
    type: string
  }
  type: 'tx' | 'address' | 'token'
  hash?: string
  address?: string
  tokenId?: string
}

export function createWindow(
  name: string,
  opts?: BrowserWindowConstructorOptions,
  webPreferences: BrowserWindowConstructorOptions['webPreferences'] = {}
) {
  log.verbose(`Creating ${name} window`)

  const browserWindow = new BrowserWindow({
    ...opts,
    frame: false,
    acceptFirstMouse: true,
    transparent: process.platform === 'darwin',
    show: false,
    backgroundColor: COLORWAY_SKINS[store('main.colorway') as keyof typeof COLORWAY_SKINS]['background'],
    skipTaskbar: process.platform !== 'linux',
    webPreferences: {
      ...webPreferences,
      preload: path.resolve(process.env.BUNDLE_LOCATION, 'bridge.js'),
      backgroundThrottling: false, // Allows repaint when window is hidden
      contextIsolation: true,
      webviewTag: false,
      sandbox: true,
      defaultEncoding: 'utf-8',
      nodeIntegration: false,
      scrollBounce: true,
      navigateOnDragDrop: false,
      disableBlinkFeatures: 'Auxclick'
    }
  })

  browserWindow.webContents.once('did-finish-load', () => {
    log.info(`Created ${name} renderer process, pid:`, browserWindow.webContents.getOSProcessId())
  })
  browserWindow.webContents.on('will-navigate', (e) => e.preventDefault()) // Prevent navigation
  browserWindow.webContents.on('will-attach-webview', (e) => e.preventDefault()) // Prevent attaching <webview>
  browserWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' })) // Prevent new windows

  return browserWindow
}

export function createViewInstance(
  ens = '',
  webPreferences: BrowserWindowConstructorOptions['webPreferences'] = {}
) {
  const viewInstance = new BrowserView({
    webPreferences: {
      ...webPreferences,
      contextIsolation: true,
      webviewTag: false,
      sandbox: true,
      defaultEncoding: 'utf-8',
      nodeIntegration: false,
      scrollBounce: true,
      navigateOnDragDrop: false,
      disableBlinkFeatures: 'Auxclick',
      preload: path.resolve('./main/windows/viewPreload.js'),
      partition: `persist:${ens}`
    }
  })

  viewInstance.webContents.on('will-navigate', (e) => e.preventDefault())
  viewInstance.webContents.on('will-attach-webview', (e) => e.preventDefault())
  viewInstance.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  return viewInstance
}

const externalWhitelist = [
  'https://frame.sh',
  'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf',
  'https://addons.mozilla.org/en-US/firefox/addon/frame-extension',
  'https://github.com/floating/frame/issues/new',
  'https://github.com/floating/frame/blob/master/LICENSE',
  'https://github.com/floating/frame/blob/0.5/LICENSE',
  'https://shop.ledger.com/pages/ledger-nano-x?r=1fb484cde64f',
  'https://shop.trezor.io/?offer_id=10&aff_id=3270',
  'https://discord.gg/UH7NGqY',
  'https://frame.canny.io',
  'https://feedback.frame.sh',
  'https://wiki.trezor.io/Trezor_Bridge',
  'https://opensea.io'
]

const isValidReleasePage = (url: string) =>
  url.startsWith('https://github.com/floating/frame/releases/tag') ||
  url.startsWith('https://github.com/frame-labs/frame-canary/releases/tag')
const isWhitelistedHost = (url: string) =>
  externalWhitelist.some((entry) => url === entry || url.startsWith(entry + '/'))

export function openExternal(url = '') {
  if (isWhitelistedHost(url) || isValidReleasePage(url)) {
    shell.openExternal(url)
  }
}

async function urlExists(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'manual' })
    return !response.redirected && response.ok
  } catch (error) {
    console.log(error)
    return false
  }
}

async function getTokenUrl(explorer: string, address: string, tokenId?: string) {
  const paths = {
    tokenPath: `${explorer}/token/${address}`,
    nftPath: `${explorer}/nft/${address}/${tokenId}`
  }
  if (!tokenId) return paths.tokenPath
  const urls = [paths.nftPath, paths.tokenPath]
  const urlExistenceList = await Promise.all(urls.map(urlExists))
  const existingUrlIndex = urlExistenceList.findIndex((exists) => exists)
  return existingUrlIndex >= 0 ? urls[existingUrlIndex] : `${explorer}/address/${address}`
}

export async function openBlockExplorer(openExplorer: OpenExplorer) {
  const { chain, type, hash, address, tokenId } = openExplorer

  // remove trailing slashes from the base url
  const explorer = (store('main.networks', chain.type, chain.id, 'explorer') || '').replace(/\/+$/, '')

  if (!explorer) return

  const urlFormats = {
    tx: () => hash && `${explorer}/tx/${hash}`,
    token: async () => address && (await getTokenUrl(explorer, address, tokenId)),
    address: () => address && `${explorer}/address/${address}`
  }

  const explorerUrl = explorer && urlFormats[type] ? await urlFormats[type]() : explorer

  shell.openExternal(explorerUrl || explorer)
}
