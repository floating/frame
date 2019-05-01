const ens = require('./index')
const store = require('../store')

const NAME = 'ethereumfoundation.eth'

store.observer( async () => {
  
  // Get connection
  const connection = store('main.connection.secondary')
  
  // On connect -> resolve name and address
  if (connection.connected) {
    
    try {

      console.log("\n*** ENS integration demo ***")
      
      // Resolve name
      console.log("\nResolving name:", NAME)
      const address = await ens.resolveName(NAME)
      console.log("Address:", address)

      // Resolve address
      console.log("\nResolving address:", address)
      const name = await ens.resolveAddress(address)
      console.log("Name:", name)
    
    } catch(err) { console.error(err) }
    
  }

})


