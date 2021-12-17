const log = require('electron-log')
const { hash } = require('eth-ens-namehash')
const crypto = require('crypto')
const cheerio = require('cheerio')

const resolve = require('./server/resolve')
const store = require('../store').default
// const ipfs = require('../ipfs')

const windows = require('../windows')
const nebulaApi = require('../nebula').default

const nebula = nebulaApi()

const server = require('./server')

const getDappColors = async (dappId) => {
  const dapp = store('main.dapps', dappId)
  const session = crypto.randomBytes(6).toString('hex')
  server.sessions.add(dappId, session)

  const url = `http://${dapp.ens}.localhost:8421/?session=${session}`
  try {
    const colors = await windows.extractColors(url)
    store.updateDapp(dappId, { colors })
    server.sessions.remove(dappId, session)
  } catch (e) {
    log.error(e)
  }
}

const updateDappContent = async (dappId, contentURI) => {
  // TODO: Make sure content is pinned before proceeding
  store.updateDapp(dappId, { content: contentURI })
}

const checkStatus = async dappId => {
  const dapp = store('main.dapps', dappId)
  const resolved = await nebula.resolve(dapp.ens)

  store.updateDapp(dappId, { record: resolved.record })
  if (dapp.content !== resolved.record.content) {
    updateDappContent(dappId, resolved.record.content)
  }

  if (!dapp.colors) {
    getDappColors(dappId)
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
  Object.keys(dapps || {}).filter(id => dapps[id].status === 'initial').forEach(id => {
    store.updateDapp(id, { status: 'loading' })
    checkStatus(id)
  })
})

let nextId = 0
const getId = () => (++nextId).toString()

const surface = {
  manifest: (ens) => {
    // gets the dapp manifest and returns all options and details for user to confirm before installing
  },
  add: (dapp) => {
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
  addServerSession (namehash, session) {
    server.sessions.add(namehash, session)
  },
  unsetCurrentView (frameId) {
    store.setCurrentFrameView(frameId, '')
  },
  open (frameId, ens) {
    const session = crypto.randomBytes(6).toString('hex')
    const dappId = hash(ens)
    server.sessions.add(dappId, session)
    const url = `http://${ens}.localhost:8421/?session=${session}`
    const view = {
      id: getId(),
      ready: false,
      dappId,
      url
    }
    store.addFrameView(frameId, view)
  }
}

module.exports = surface

/// Old Dapp Class

class Dapps {
  constructor () {
    // setInterval(() => {
    //   this._updateHashes()
    // }, 60000)
    // setInterval(() => {
    //   this._updatePins()
    // }, 15000)
    this.defaults = [
      {
        name: 'wallet.frame.eth',
        options: { docked: true }
      },
      {
        name: 'aragon.frame.eth',
        options: { docked: true }
      },
      {
        name: 'uniswap.frame.eth',
        options: { docked: false }
      },
      {
        name: 'matoken.eth',
        options: { docked: false }
      },
      {
        name: 'matt.eth'
      },
      {
        name: 'sushi.frame.eth',
        options: { docked: true }
      },
    ]
    // this.observer = store.observer(() => {
    //   const ipfs = store('main.ipfs')
    //   if (ipfs.id) {
    //     console.log('Got IPFS update')
    //     this._updatePins()
    //     const ethCon = store.observer(() => {
    //       const connection = store('main.connection')
    //       const status = [connection.local.status, connection.secondary.status]
    //       const connected = status.indexOf('connected') > -1
    //       if (connected) {
    //         this._addDefaults()
    //         setTimeout(() => ethCon.remove(), 0)
    //       }
    //     })
    //   }
    // })

    // ipfs.on('state', state => {
    //   if (state === 'ready') {
    //     this._updatePins()
    //     const ethCon = store.observer(() => {
    //       const connection = store('main.connection')
    //       const status = [connection.local.status, connection.secondary.status]
    //       const connected = status.indexOf('connected') > -1
    //       if (connected) {
    //         this._addDefaults()
    //         setTimeout(() => ethCon.remove(), 0)
    //       }
    //     })
    //   }
    // })
  }

  async _addDefaults () {
    this.defaults.forEach(async dapp => {
      if (store('main.dapp.removed').indexOf(dapp.name) === -1) {
        await this.add(dapp.name, dapp.options, err => {
          if (err) log.error('Error adding default dapp', dapp.name, err)
        })
      }
    })
  }

  async add (domain, options, cb = () => {}) {
    // console.log('dapps.add', domain, options, cb)
    // Resolve ENS name
    let namehash
    try {
      namehash = hash(domain)
    } catch (e) {
      return cb(e)
    }
    // Check if already added
    if (store(`main.dapp.details.${namehash}`)) {
      // store.removeDapp(namehash)
      // store.addDapp()
      // store.addDapp(namehash, { domain, type, hash, pinned: false })
      return cb(new Error('Dapp already added'))
    }

    // Resolve content
    const contentCid = await resolve.rootCid(domain)

    // If content available -> store dapp
    if (contentCid) {
      store.addDapp(namehash, { domain, cid: contentCid, pinned: false }, options)
      // Get Dapp Icon
      try {
        // const index = await ipfs.getFile(`${contentCid}/index.html`)

        // const $ = cheerio.load(index.content.toString('utf8'))
        // let favicon = ''
        // $('link').each((i, link) => {
        //   if ($(link).attr('rel') === 'icon' || $(link).attr('rel') === 'shortcut icon') {
        //     favicon = favicon || $(link).attr('href')
        //   }
        // })
        // if (favicon.startsWith('./')) favicon = favicon.substring(2)
        // let icon
        // const file = await ipfs.getFile(`${contentCid}/${favicon || 'favicon.ico'}`)
        // if (file) {
        //   icon = {
        //     cid: file.cid.toString(),
        //     path: file.path,
        //     name: file.name,
        //     content: Buffer.from(file.content).toString('base64')
        //   }
        // }
        // store.updateDapp(namehash, { icon })
        this._pin(contentCid)
        cb(null)
      } catch (e) {
        log.error(e)
        store.removeDapp(namehash)
        cb(new Error('Could not resolve dapp: ' + e.message))
      }
    // Else -> throw
    } else {
      cb(new Error('Could not resolve ENS name to content hash'))
    }
  }

  remove (domain, cb) {
    const namehash = hash(domain)

    // Check if exists
    if (!store(`main.dapp.details.${namehash}`)) return cb(new Error('Dapp doesn\'t exist'))

    // Remove dapp
    store.removeDapp(namehash)
    cb(null)
  }

  move (fromArea, fromIndex, toArea, toIndex, cb) {
    store.moveDapp(fromArea, fromIndex, toArea, toIndex)
    cb(null)
  }

  async launch (domain, cb) {
    const dapp = store(`main.dapp.details.${hash(domain)}`)
    if (!dapp) return cb(new Error('Could not find dapp'))
    // if (!dapp.pinned) return cb(new Error('Dapp not pinned'))
    // if (!ipfs return cb(new Error('IPFS client not running'))
    const session = crypto.randomBytes(6).toString('hex')
    server.sessions.add(domain, session)
    windows.openView(domain, session)
    // shell.openExternal(`http://localhost:8421/?dapp=${domain}:${session}`)
    if (cb) cb(null)
  }

  async _pin (cid) {
    // await ipfs.pin(cid)

    // const dapp = Object.entries(store('main.dapp.details')).find(([namehash, dapp]) => dapp.cid === cid)

    // return dapp && !!store.updateDapp(dapp[0], { pinned: true })
  }

  _updateHashes () {
    // For each registered dapp ->
    Object.entries(store('main.dapp.details')).forEach(async ([namehash, dapp]) => {
      // 1) resolve content
      const result = await ens.resolveContent(dapp.domain)
      // 2) if new content hash -> update dapp and pin content
      if (result && result.hash !== dapp.cid) {
        store.updateDapp(namehash, { cid: result.hash, pinned: false })
        this._pin(result.hash)
      }
    })
  }

  _updatePins () {
    Object.entries(store('main.dapp.details')).forEach(async ([namehash, dapp]) => {
      const ipfsState = store('main.clients.ipfs.state')
      if (ipfsState === 'ready' && !dapp.pinned) {
        this._pin(dapp.cid)
      }
    })
  }
}