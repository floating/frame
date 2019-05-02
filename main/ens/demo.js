const ens = require('./index')
const provider = require('../provider')

const NAME = 'monkybrain.eth'

provider.connection.on('connect', async () => {

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

    // Resolve content
    console.log("\nResolving content:", address)
    const content = await ens.resolveContent(name)
    console.log("Content:", content)
  
  } catch(err) { console.error(err) }
  
})


