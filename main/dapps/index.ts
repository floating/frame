import { app } from 'electron'
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
import { verifyDapp } from './verify'

const nebula = nebulaApi()
const dappCacheDir = path.join(app.getPath('userData'), 'DappCache')

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
  _read() {}
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

const cacheDapp = async (dappId: string, hash: string) => {
  return new Promise((resolve, reject) => {
    try {
      const dapp = new DappStream(hash)

      dapp.pipe(
        tar
          .extract(dappCacheDir, {
            map: (header) => {
              header.name = path.join(dappId, ...header.name.split('/').slice(1))
              return header
            }
          })
          .on('finish', async () => {
            try {
              await getDappColors(dappId)
              resolve(dappId)
            } catch (e) {
              reject(e)
            }
          })
      )
    } catch (e) {
      reject(e)
    }
  })
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
async function checkStatus(dappId: string) {
  clearTimeout(retryTimer)
  const dapp = store('main.dapps', dappId) as Dapp

  try {
    const { record, manifest } = await nebula.resolve(dapp.ens)

    const version = (manifest || {}).version || 'unknown'

    log.info(`resolved content for ${dapp.ens}, version: ${version}`)

    store.updateDapp(dappId, { record })

    const dappVerified = async () =>
      manifest.content && verifyDapp(`${dappCacheDir}/${dappId}`, manifest.content)

    // TODO: Add case here to also run an update if the maifest doesn't match the local dir
    if (dapp.content !== manifest.content || !(await dappVerified())) {
      log.info(`Updating content for dapp ${dappId} from hash ${manifest.content}`)
      updateDappContent(dappId, manifest)
    }

    store.updateDapp(dappId, { status: 'ready' })

    // The frame id 'dappLauncher' needs to refrence target frame
    if (dapp.openWhenReady) surface.open('dappLauncher', dapp.ens)
  } catch (e) {
    log.error('Check status error', e)
    const retry = dapp.checkStatusRetryCount || 0
    if (retry < 4) {
      retryTimer = setTimeout(() => {
        store.updateDapp(dappId, { status: 'initial', checkStatusRetryCount: retry + 1 })
      }, 1000)
    } else {
      store.updateDapp(dappId, { status: 'failed', checkStatusRetryCount: 0 })
    }
  }

  // Takes dapp entry and config
  // Checks if assets are correctly synced
  // Checks if all assets are up to date with current manifest
  // Installs new assets if changed and config is set to sync
  // Sets status to 'updating' when updating the bundle
  // Sets status to 'ready' when done

  // dapp.config // the user's prefrences for installing assets from the manifest
  // dapp.manifest // a copy of the latest manifest we have resolved for the dapp
  // dapp.meta // meta info about the dapp including name, colors, icons, descriptions,
  // dapp.ens // ens name for this dapp
  // dapp.storage // local storage values for dapp
}

store.observer(() => {
  const dapps = store('main.dapps')
  Object.keys(dapps || {})
    .filter((id) => dapps[id].status === 'initial')
    .forEach((id) => {
      store.updateDapp(id, { status: 'loading' })

      if (nebula.ready()) {
        checkStatus(id)
      } else {
        nebula.once('ready', () => checkStatus(id))
      }
    })
})

const refreshDapps = () => {
  const dapps = store('main.dapps')
  Object.keys(dapps || {}).forEach((id) => {
    store.updateDapp(id, { status: 'loading' })
    if (nebula.ready()) {
      checkStatus(id)
    } else {
      nebula.once('ready', () => checkStatus(id))
    }
  })
}

setInterval(() => refreshDapps(), 1000 * 60 * 60)

let nextId = 0
const getId = () => (++nextId).toString()

const surface = {
  manifest: (ens: string) => {
    // gets the dapp manifest and returns all options and details for user to confirm before installing
  },
  add: (dapp: Dapp) => {
    const { ens, config } = dapp

    const id = hash(ens)
    const status = 'initial'

    // Validate ens name and config

    // Check that dapp has not been added already
    // If ens name has been installed
    // return error

    // If ens name has not been installed, start install
    store.appDapp({ id, ens, status, config, manifest: {}, current: {} })
  },
  addServerSession(namehash: string /* , session */) {
    // server.sessions.add(namehash, session)
  },
  unsetCurrentView(frameId: string) {
    store.setCurrentFrameView(frameId, '')
  },
  open(frameId: string, ens: string) {
    const session = crypto.randomBytes(6).toString('hex')
    const dappId = hash(ens)

    const dapp = store('main.dapps', dappId)

    if (dapp.status === 'ready') {
      const url = `http://${ens}.localhost:8421/?session=${session}`
      const view = {
        id: getId(),
        ready: false,
        dappId,
        ens,
        url
      }

      server.sessions.add(ens, session)
      store.addFrameView(frameId, view)
    } else {
      store.updateDapp(dappId, { ens, status: 'initial', openWhenReady: true })
    }
  }
}

export default surface
