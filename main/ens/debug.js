const ens = require('./index')
const store = require('../store')

store.observer( async () => {
  const connection = store('main.connection.secondary')
  if (connection.connected) {
    console.log("Resolving")
    const result = await ens.resolveName('ethereum.eth')
    console.log(result)
  }
})

