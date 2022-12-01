import { hash } from 'eth-ens-namehash'
import log from 'electron-log'
import crypto from 'crypto'

import store from '../store'
import nebulaApi from '../nebula'
import server from './server'
import extractColors from '../windows/extractColors'

const nebula = nebulaApi()

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

// TODO: change to correct manifest type one Nebula version with types are published
async function updateDappContent(dappId: string, contentURI: string, manifest: any) {
  // TODO: Make sure content is pinned before proceeding
  store.updateDapp(dappId, { content: contentURI, manifest })
}

let retryTimer: NodeJS.Timeout
async function checkStatus(dappId: string) {
  clearTimeout(retryTimer)
  const dapp = store('main.dapps', dappId)
  try {
    const resolved = await nebula.resolve(dapp.ens)

    const version = (resolved.manifest || {}).version || 'unknown'

    log.info(`resolved content for ${dapp.ens}, version: ${version}`)

    store.updateDapp(dappId, { record: resolved.record })
    if (dapp.content !== resolved.record.content) {
      updateDappContent(dappId, resolved.record.content, resolved.manifest)
    }

    if (!dapp.colors) getDappColors(dappId)

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
        url,
      }

      server.sessions.add(ens, session)

      store.addFrameView(frameId, view)
    } else {
      store.updateDapp(dappId, { ens, status: 'initial', openWhenReady: true })
    }
  },
}

export default surface
