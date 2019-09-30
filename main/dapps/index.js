const electron = require('electron')
const log = require('electron-log')
const store = require('../store')
const ipfs = require('../clients/Ipfs')
const { hash } = require('eth-ens-namehash')
const { fetchFavicon } = require('@meltwater/fetch-favicon')
const { execSync } = require('child_process')

const IPFS_GATEWAY_URL = 'https://cloudflare-ipfs.com'

const mock = {
  ens: {
    resolveContent: (domain) => {
      return { type: 'ipfs', hash: 'QmXSBLw6VMegqkCHSDBPg7xzfLhUyuRBzTb927KVzKC1vq' }
    }
  },
  shell: {
    openExternal: (url) => {
      require('child_process').exec(`xdg-open "${url}"`)
    }
  }
}

const ens = electron.app ? require('../ens') : mock.ens
const shell = electron.shell ? electron.shell : mock.shell

class Dapps {
  constructor () {
    setInterval(() => {
      this._updateHashes()
    }, 60000)
    setInterval(() => {
      this._updatePins()
    }, 15000)
  }

  async add (domain, cb) {
    // Resolve ENS name
    const namehash = hash(domain)

    // Check if already added
    if (store(`main.dapps.${namehash}`)) return cb(new Error('Dapp already added'))

    // Resolve content
    const content = await ens.resolveContent(domain)

    // If content available -> store dapp
    if (content) {
      const { type, hash } = content
      store.addDapp(namehash, { domain, type, hash, pinned: false })
      this._pin(hash, () => {
        console.log('Pinned first time')
        store.updateDapp(namehash, { pinned: true })
      })
      cb(null)
    // Else -> throw
    } else {
      cb(new Error('Could not resolve ENS name to content hash'))
    }
  }

  remove (domain, cb) {
    const namehash = hash(domain)

    // Check if exists
    if (!store(`main.dapps.${namehash}`)) return cb(new Error(`Dapp doesn't exist`))

    // Remove dapp
    store.removeDapp(namehash)
    cb(null)
  }

  async launch (domain, cb) {
    // Get dapp meta data
    const nameHash = hash(domain)
    const dapp = store(`main.dapps.${nameHash}`)
    if (!dapp) return cb(new Error(`Could not find dapp`))

    // Determine if local node or gateway should be used
    const running = await ipfs.isRunning()
    if (!running) return cb(new Error('IPFS client not running'))
    const baseUrl = running ? 'http://localhost:8080' : IPFS_GATEWAY_URL

    // Launch dapp in browser
    shell.openExternal(`${baseUrl}/${dapp.type}/${dapp.hash}`)
    cb(null)
  }

  async _pin (hash, cb) {
    if (store('main.clients.ipfs.state' !== 'ready')) return cb(new Error('IPFS client not ready'))
    ipfs.api.pin.add(hash, (err, res) => {
      if (err) return cb(new Error(`Failed to pin content with hash ${hash}`))
      cb(null)
    })
  }

  _updateHashes () {
    // For each registered dapp ->
    Object.entries(store('main.dapps')).forEach(async ([namehash, dapp]) => {
      // 1) resolve content
      const result = await ens.resolveContent(dapp.domain)

      // 2) if new content hash -> update dapp and pin content
      if (result && result.hash !== dapp.hash) {
        store.updateDapp(namehash, { hash: result.hash, pinned: false })
        this._pin(result.hash, (err) => {
          if (err) return log.error(err)
          store.updateDapp(namehash, { pinned: true })
        })
      }
    })
  }

  _updatePins () {
    Object.entries(store('main.dapps')).forEach(async ([namehash, dapp]) => {
      const ipfsState = store('main.clients.ipfs.state')
      if (ipfsState === 'ready' && !dapp.pinned) {
        console.log('Pinning', dapp.domain)
        this._pin(dapp.hash, (err) => {
          if (err) return log.error(err)
          store.updateDapp(namehash, { pinned: true })
        })
      }
    })
  }



  // EXPERIMENTAL
  // async _getIcon () {
  //   const TEMP_URL = 'https://www.myetherwallet.com/'
  //   let iconUrl = await fetchFavicon(TEMP_URL)
  //   if (iconUrl) {
  //     const response = await axios({
  //       url: iconUrl,
  //       method: 'GET',
  //       responseType: 'arraybuffer'
  //     })
  //     // fs.writeFileSync('test.png', response.data)
  //   }
  // }
}

const dapps = new Dapps()
module.exports = dapps

// DEBUG
store.observer(_ => {
  console.log(store('main.dapps'))
})

// setInterval(async () => {
//   console.log('peers', (await ipfs.api.swarm.peers()).length)
// }, 3000)

// setTimeout(() => {
//   const domain = 'monkybrain.eth'
//   dapps.add(domain, (err) => {
//     if (err) console.error(err)
//     // dapps.launch(domain, () => {})
//   })
// }, 2000)
