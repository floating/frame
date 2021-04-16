const { hash } = require('eth-ens-namehash')

const store = require('../../../store')
const nebula = require('nebula')()

const resolve = {
  rootCid: async (app) => {
    const cid = store(`main.dapp.details.${hash(app)}.cid`)
    if (cid) return cid
    const record = await nebula.resolve(app)
    return record.dapp.files
  }
}

module.exports = resolve
