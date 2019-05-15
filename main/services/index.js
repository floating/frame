const geth = require('./Service/geth')
// const ipfs = require('./ipfs')

module.exports = {
  stop: () => {
    geth.stop()
    // ipfs.stop()
  }
}

// DEBUG
geth.start()
store.observer( () => {
  console.log(
    store('main.clients')
  )
})
