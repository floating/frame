const { app } = require('electron')
const store = require('../store')
const axios = require('axios')
const fs = require('fs')
const { hash } = require('eth-ens-namehash')
const { fetchFavicon } = require('@meltwater/fetch-favicon')

// const ens = require('../ens')

const userData = app ? app.getPath('userData') : './test/.userData'

const ens = {
  resolveContent: (domain) => {
    return { type: 'ipfs', hash: 'QmXSBLw6VMegqkCHSDBPg7xzfLhUyuRBzTb927KVzKC1vq' }
  }
}

exports.resolveHash = (hash) => {
  if (store('main.clients.ipfs.state') === 'ready') {
    return 'localhost:8080/ipfs/'
  }
}

const api = {
  add: (domain, cb) => {
    const nameHash = hash(domain)
    const content = ens.resolveContent(domain)
    if (content) {
      store.addDapp({ nameHash, domain, type: 'ipfs', hash: 'QmXSBLw6VMegqkCHSDBPg7xzfLhUyuRBzTb927KVzKC1vq' })
      // this._getIcon()
      cb(null)
    } else {
      cb(new Error('Could not resolve ENS name to ipfs content'))
    }
  },

  list: () => {
    return store('main.dapps')
  },

  _getIcon: async () => {
    const TEMP_URL = 'https://www.myetherwallet.com/'
    let iconUrl = await fetchFavicon(TEMP_URL)
    if (iconUrl) {
      const response = await axios({
        url: iconUrl,
        method: 'GET',
        responseType: 'arraybuffer'
      })
      fs.writeFileSync('test.png', response.data)
    }
  }
}

module.exports = api

// DEBUG
store.observer(_ => {
  console.log(store('main.dapps'))
})
setTimeout(() => {
  api.add('monkybrain.eth', (err) => {
    if (err) console.error(err)
    const dapps = api.list()
    console.log(dapps)
  })
}, 1000)