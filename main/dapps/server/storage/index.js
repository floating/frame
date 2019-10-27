const store = require('../../../store')

module.exports = {
  get: hash => store(`main.dappStorage.${hash}`),
  update: (hash, state) => {
    try { state = JSON.parse(state) } catch (e) { state = '' }
    store.setDappStorage(hash, state)
  }
}
