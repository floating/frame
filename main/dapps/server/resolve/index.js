const { hash } = require('eth-ens-namehash')

const store = require('../../../store')

const resolve = {
  // app: url => (new URL(url)).pathname.split('/')[1],
  hash: app => store(`main.dapps.${hash(app)}.hash`)
}

module.exports = resolve
