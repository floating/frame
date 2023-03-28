const store = require('../../../store').default

module.exports = {
  get: (hash) => store(`main.dapp.storage.${hash}`),
  update: (hash, state) => {
    try {
      state = JSON.parse(state)
    } catch (e) {
      state = ''
    }
    store.setDappStorage(hash, state)
  }
}
