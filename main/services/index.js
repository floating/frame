const geth = require('./geth')
const store = require('../store')
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
