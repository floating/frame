const store = require('../../../store')

module.exports = {
  get: hash => store(`main.dappStorage.${hash}`),
  update: (res, hash, state) => {
    try { state = JSON.parse(state) } catch (e) { state = '' }
    if (!state) {
      res.writeHead(400)
      res.end('Invlaid or missing state in storage update')
    } else {
      store.setDappStorage(hash, state)
      res.writeHead(200)
      res.end()
    }
  }
}
