const electron = require('electron')
const store = require('../store')
const axios = require('axios')
const ipfs = require('../clients/Ipfs')
const { hash } = require('eth-ens-namehash')
const { fetchFavicon } = require('@meltwater/fetch-favicon')

// const userData = app ? app.getPath('userData') : './test/.userData'
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
      store.addDapp({ namehash, domain, type, hash })
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
    const running = await this._ipfsLocalNodeRunning()
    const baseUrl = running ? 'http://localhost:8080' : IPFS_GATEWAY_URL

    // Launch dapp in browser
    shell.openExternal(`${baseUrl}/${dapp.type}/${dapp.hash}`)
    cb(null)
  }

  // EXPERIMENTAL
  async _getIcon () {
    const TEMP_URL = 'https://www.myetherwallet.com/'
    let iconUrl = await fetchFavicon(TEMP_URL)
    if (iconUrl) {
      const response = await axios({
        url: iconUrl,
        method: 'GET',
        responseType: 'arraybuffer'
      })
      // fs.writeFileSync('test.png', response.data)
    }
  }

  async _ipfsLocalNodeRunning () {
    try {
      await ipfs.getVersion(); return true
    } catch (err) { return false }
  }
}

const dapps = new Dapps()
module.exports = dapps

// DEBUG
store.observer(_ => {
  console.log(store('main.dapps'))
})

// setTimeout(() => {
//   const domain = 'monkybrain.eth'
//   dapps.add(domain, (err) => {
//     if (err) console.error(err)
//     // dapps.launch(domain, () => {})
//   })
// }, 2000)
