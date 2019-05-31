const geth = require('./geth')
const ipfs = require('./ipfs')
const store = require('../store')
const { app } = require('electron')

// Ethereum
app.on('ready', () => {
  let on = null
  let network = store('main.connection.network')
  store.observer(_ => {

    // If client toggled ->
    if (on !== store('main.clients.geth.on')) {
      // Update holder variable
      on = store('main.clients.geth.on')
      // If toggled on -> start geth and toggle on local connection
      if (on) {
        geth.start()
        if (!store('main.connection.local.on')) setTimeout(() => store.toggleConnection('local'), 1000)
      // Else -> stop geth and toggle off local connection
      } else {
        if (store('main.connection.local.on')) store.toggleConnection('local')
        setTimeout(() => geth.stop(), 1000)
      }
    }

    if (network !== store('main.connection.network') && store('main.clients.geth.on')) {
      network = store('main.connection.network')
      store.toggleClient('geth')
      geth.once('exit', () => store.toggleClient('geth'))
    }

  })
})

// IPFS
app.on('ready', () => {
  let on = null
  store.observer(_ => {
    if (on !== store('main.clients.ipfs.on')) {
      on = store('main.clients.ipfs.on')
      on ? ipfs.start() : ipfs.stop()
    }
  })
})

module.exports = {
  stop: () => {
    geth.stop()
    ipfs.stop()
  }
}
