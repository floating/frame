// NPM
const codec = require('abi-codec')
const namehash = require('eth-ens-namehash')

// Frame
const store = require('../store')
const provider = require('../provider')

// Local
const interfaces = require('./artifacts/interfaces')
const registryAddresses = require('./artifacts/addresses')

/*** PUBLIC ***/
exports.resolveName = async (name) => {

  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // Encode function input
  const node = namehash.hash(name)
  const input = codec.encodeInput(interfaces.resolver, 'addr', [node])
  
  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(interfaces.resolver, 'addr', output)
  return decodedOutput[0]

}

exports.resolveAddress = async (address) => {

  // Construct name
  const name = `${address.slice(2)}.addr.reverse`

  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // Encode function input
  const node = namehash.hash(name)
  const input = codec.encodeInput(interfaces.resolver, 'name', [node])
  
  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(interfaces.resolver, 'name', output)
  return decodedOutput[0]

}

/*** PRIVATE ***/
const getResolverAddress = async (name) => {

  // Hash name
  const hash = namehash.hash(name)

  // Get registry contract address for selected network
  const networkId = store('main.connection.network')
  const registryAddress = registryAddresses[networkId]

  // Encode function input
  const input = codec.encodeInput(interfaces.registry, 'resolver', [hash])
    
  // Make JSON RPC call
  const params = { to: registryAddress, data: input }
  const output = await makeCall('eth_call', params)

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(interfaces.registry, 'resolver', output)
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