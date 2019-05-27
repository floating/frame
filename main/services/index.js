const geth = require('./geth')
const ipfs = require('./ipfs')
const store = require('../store')
const { app } = require('electron')

app.on('ready', () => {
  let on = null
  store.observer(_ => {
    if (on !== store('main.clients.geth.on')) {
      on = store('main.clients.geth.on')
      on ? geth.start() : geth.stop()
    }
  })
})

module.exports = {
  stop: () => {
    geth.stop()
    ipfs.stop()
  }
}
