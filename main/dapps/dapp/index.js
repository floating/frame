const { hash } = require('namehash')
const store = require('../../store')

class Dapp {
  constructor (namehash) {
    this.namehash = namehash
    const dapp = store(`main.dapps.${namehash}`)
    if (dapp) {
      this.type = dapp.type
      this.content = dapp.content
    }
  }
}

module.exports = Dapp
