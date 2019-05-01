// NPM
const codec = require('abi-codec')
const namehash = require('eth-ens-namehash')

// Frame
const store = require('../store')
const provider = require('../provider')

// Local
const interface = require('./interface.js')
const registryAddresses = require('./addresses')

/*** PUBLIC ***/
exports.resolveName = async (name) => {

  // Hash name
  const hash = namehash.hash(name)
  
  // Encode function input
  const input = codec.encodeInput(interface.resolver, 'addr', [hash])
  
  // Get resolver address
  const resolverAddress = await getResolverAddress(name)
  
  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }

  // Make JSON RPC call
  const output = await makeCall('eth_call', params)

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(interface.resolver, 'addr', output)

  return decodedOutput[0]

}

/*** PRIVATE ***/
const getResolverAddress = async (name) => {

  // Hash name
  const hash = namehash.hash(name)

  // Encode function input
  const input = codec.encodeInput(interface.registry, 'resolver', [hash])
  
  // Get registry contract address for selected network
  const networkId = store('main.connection.network')
  const registryAddress = registryAddresses[networkId]
  
  // Make JSON RPC call
  const params = { to: registryAddress, data: input }

  // Make JSON RPC call
  const output = await makeCall('eth_call', params)

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(interface.registry, 'resolver', output)
  return decodedOutput[0]

}

const makeCall = (method, params) => {

  return new Promise( (resolve, reject) => {
    
    // Construct JSON RPC payload
    const payload = { jsonrpc: '2.0', id: 1, method: method, params: [params, "latest"] }
    
    // Send payload to provider and resolve promise with result
    provider.send(payload, ({ result }) => resolve(result))
  
  })

}


// console.log(hash)
// const abi = contract.methods.resolver(hash).encodeABI()
// const params = {
//   to: address.mainnet,
//   data: abi
// }

// setTimeout( () => {
//   console.log("Sending")
//   const payload = { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [params, "latest"] }
//   provider.send(payload, ({ result }) => {
//     console.log(result)
//     console.log(coder.decodeParameter('address', result))
//   })
// }, 100)

