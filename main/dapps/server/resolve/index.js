const { hash } = require('eth-ens-namehash')

const store = require('../../../store').default
const nebula = require('../../../nebula')()

const resolve = {
  rootCid: async (app) => {
    const cid = store(`main.dapp.details.${hash(app)}.cid`)
    if (cid) return cid
    const resolved = await nebula.resolve(app)
    return resolved.record.content
  }
}

module.exports = resolve
