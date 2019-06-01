const geth = require('./Geth')
const ipfs = require('./Ipfs')
const store = require('../store')
const { app } = require('electron')

const TOGGLE_TIMEOUT = 1000

// Ethereum
app.on('ready', () => {
  // Init
  let on = null
  let network = store('main.connection.network')

  // Observe changes to geth client
  store.observer(_ => {
    // If client toggled ->
    if (on !== store('main.clients.geth.on')) {
      // Update holder variable
      on = store('main.clients.geth.on')

      // If toggled on ->
      if (on) {
        // Start geth client
        geth.start()

        // Toggle on local connection after <TOGGLE_TIMEOUT> milliseconds
        if (!store('main.connection.local.on')) setTimeout(() => store.toggleConnection('local'), TOGGLE_TIMEOUT)

      // Else ->
      } else {
        // Toggle off local connection
        if (store('main.connection.local.on')) store.toggleConnection('local')

        // Stop geth after <TOGGLE_TIMEOUT> milliseconds
        setTimeout(() => geth.stop(), TOGGLE_TIMEOUT)
      }
    }

    // If network changed and geth client is running ->
    if (network !== store('main.connection.network') && store('main.clients.geth.on')) {
      network = store('main.connection.network')
      // Restart client (with updated network args)
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
