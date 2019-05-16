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
// geth.start()
// setTimeout(() => {
//   const { app } = require('electron')
//   console.log(app)
// }, 10000)
// store.observer(() => {
//   console.log(
//     store('main.clients')
//   )
// })
