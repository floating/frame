import path from 'path'
import { Readable } from 'stream'
import { hash } from 'eth-ens-namehash'
import log from 'electron-log'
import crypto from 'crypto'
import tar from 'tar-fs'

import store from '../store'
import nebulaApi from '../nebula'
import server from './server'
import extractColors from '../windows/extractColors'
import { dappPathExists, getDappCacheDir, isDappVerified } from './verify'

import type { Dapp } from '../store/state/types'

const nebula = nebulaApi()

class DappStream extends Readable {
  constructor(hash: string) {
    super()
    this.start(hash)
  }
  async start(hash: string) {
    for await (const buf of nebula.ipfs.get(hash, { archive: true })) {
      this.push(buf)
    }
    this.push(null)
  }
  _read() {
    // empty
  }
}

function getDapp(dappId: string): Dapp {
  return store('main.dapps', dappId)
}

async function getDappColors(dappId: string) {
  const dapp = getDapp(dappId)
  const session = crypto.randomBytes(6).toString('hex')
  server.sessions.add(dapp.ens, session)

  const url = `http://${dapp.ens}.localhost:8421/?session=${session}`
  try {
    const colors = await extractColors(url, dapp.ens)
    store.updateDapp(dappId, { colors })
    server.sessions.remove(dapp.ens, session)
  } catch (e) {
    log.error(e)
  }
}

const createTarStream = (dappId: string) => {
  return tar.extract(getDappCacheDir(), {
    map: (header) => ({ ...header, name: path.join(dappId, ...header.name.split('/').slice(1)) })
  })
}

const writeDapp = async (dappId: string, hash: string) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const dapp = new DappStream(hash)
      const tarStream = createTarStream(dappId)

      tarStream.on('error', reject)
      tarStream.on('finish', resolve)

      dapp.pipe(tarStream)
    } catch (e) {
      reject(e)
    }
  })
}

const cacheDapp = async (dappId: string, hash: string) => {
  await writeDapp(dappId, hash)
  await getDappColors(dappId)

  return dappId
}

// TODO: change to correct manifest type one Nebula version with types are published
async function updateDappContent(dappId: string, manifest: any) {
  try {
    // Create a local cache of the content
    await cacheDapp(dappId, manifest.content)
    store.updateDapp(dappId, { content: manifest.content, manifest })
  } catch (e) {
    log.error('error updating dapp cache', e)
  }
}

let retryTimer: NodeJS.Timeout

// Takes dappId and checks if the dapp is up to date
async function checkStatus(dappId: string) {
  clearTimeout(retryTimer)
  const dapp = store('main.dapps', dappId) as Dapp
  const { checkStatusRetryCount, openWhenReady } = dapp

  try {
    const { record, manifest } = await nebula.resolve(dapp.ens)
    const { version, content } = manifest || {}

    if (!content) {
      log.error(
        `Attempted load dapp with id ${dappId} (${dapp.ens}) but manifest contained no content`,
        manifest
      )
      return
    }

    log.info(`Resolved content for ${dapp.ens}, version: ${version || 'unknown'}`)

    store.updateDapp(dappId, { record })

    const isDappCurrent = async () => {
      return (
        dapp.content === content && (await dappPathExists(dappId)) && (await isDappVerified(dappId, content))
      )
    }

    // Checks if all assets are up to date with current manifest
    if (!(await isDappCurrent())) {
      log.info(`Updating content for dapp ${dappId} from hash ${content}`)
      // Sets status to 'updating' when updating the bundle
      store.updateDapp(dappId, { status: 'updating' })
      // Update dapp assets
      await updateDappContent(dappId, manifest)
    } else {
      log.info(`Dapp ${dapp.ens} already up to date: ${content}`)
    }
    // Sets status to 'ready' when done
    store.updateDapp(dappId, { status: 'ready', openWhenReady: false })
  } catch (e) {
    log.error('Check status error', e)
    const retry = checkStatusRetryCount || 0
    if (retry < 4) {
      retryTimer = setTimeout(() => {
        store.updateDapp(dappId, { status: 'initial', checkStatusRetryCount: retry + 1 })
      }, 1000)
    } else {
      store.updateDapp(dappId, { status: 'failed', checkStatusRetryCount: 0 })
    }
  }
}

const refreshDapps = ({ statusFilter = '' } = {}) => {
  const dapps = store('main.dapps')

  Object.keys(dapps || {})
    .filter((id) => !statusFilter || dapps[id].status === statusFilter)
    .forEach((id) => {
      store.updateDapp(id, { status: 'loading' })
      if (nebula.ready()) {
        checkStatus(id)
      } else {
        nebula.once('ready', () => checkStatus(id))
      }
    })
}

const checkNewDapps = () => refreshDapps({ statusFilter: 'initial' })

// Check all dapps on startup
refreshDapps()

// Check all dapps every hour
setInterval(() => refreshDapps(), 1000 * 60 * 60)

// Check any new dapps that are added
store.observer(checkNewDapps)

let nextId = 0
const getId = () => (++nextId).toString()

const surface = {
  manifest: (_ens: string) => {
    // gets the dapp manifest and returns all options and details for user to confirm before installing
  },
  add: (dapp: Dapp) => {
    const { ens, config } = dapp

    const id = hash(ens)
    const status = 'initial'

    const existingDapp = store('main.dapps', id)

    // If ens name has not been installed, start install
    if (!existingDapp) store.appDapp({ id, ens, status, config, manifest: {}, current: {} })
  },
  addServerSession(_namehash: string /* , session */) {
    // server.sessions.add(namehash, session)
  },
  unsetCurrentView(frameId: string) {
    store.setCurrentFrameView(frameId, '')
  },
  createSession(ens: string) {
    const session = crypto.randomBytes(6).toString('hex')
    const dappId = hash(ens)
    const url = `http://${ens}.localhost:8421/?session=${session}`

    server.sessions.add(ens, session)

    return { session, dappId, url }
  }
  // open(frameId: string, ens: string) {
  //   const session = crypto.randomBytes(6).toString('hex')
  //   const dappId = hash(ens)

  //   const dapp = store('main.dapps', dappId)

  //   if (dapp.status === 'ready') {
  //     const url = `http://${ens}.localhost:8421/?session=${session}`
  //     const view = {
  //       id: getId(),
  //       ready: false,
  //       dappId,
  //       ens,
  //       url
  //     }

  //     server.sessions.add(ens, session)

  //     if (store('main.frames', frameId)) {
  //       store.addFrameView(frameId, view)
  //     } else {
  //       log.warn(`Attempted to open frame "${frameId}" for ${ens} but frame does not exist`)
  //     }
  //   } else {
  //     store.updateDapp(dappId, { ens, status: 'initial', openWhenReady: true })
  //   }
  // }
}

export default surface
