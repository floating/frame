const { hash } = require('eth-ens-namehash')

const store = require('../../../store')
const ens = require('../../../ens')

const resolve = {
  // app: url => (new URL(url)).pathname.split('/')[1],
  cid: async (app) => {
    const cid = store(`main.dapp.details.${hash(app)}.cid`)
    if (cid) return cid
    const content = await ens.resolveContent(app)
    return content.hash
  }
}

module.exports = resolve
