// NPM modules
const {utils: {Interface}} = require('ethers')
const namehash = require('eth-ens-namehash')
const contentHash = require('content-hash')

// Frame modules
const provider = require('../provider').default
const store = require('../store').default

// Local modules
const interfaces = require('./artifacts/interfaces')
const registryAddresses = require('./artifacts/addresses')

const registryContractInterface = new Interface(interfaces.registry)
const resolverContractInterface = new Interface(interfaces.resolver)

/* PUBLIC */
exports.resolveName = async (name) => {
  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // If no resolver found -> return null
  if (!resolverAddress) return null

  // Encode function input
  const node = namehash.hash(name)
  const input = resolverContractInterface.encodeFunctionData('addr', [node])

  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return value
  const decodedOutput = resolverContractInterface.decodeFunctionResult('addr', output)
  
  return decodedOutput[0]
}

exports.resolveAddress = async (address) => {
  // Construct name
  const name = `${address.slice(2)}.addr.reverse`

  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // If no resolver found -> return null
  if (!resolverAddress) return null

  // Encode function input
  const node = namehash.hash(name)
  const input = resolverContractInterface.encodeFunctionData('name', [node])

  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return value
  const decodedOutput = resolverContractInterface.decodeFunctionResult('name', output)
  return decodedOutput[0]
}

exports.resolveContent = async (name) => {
  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // If no resolver found -> return null
  if (!resolverAddress) return null

  // Encode function input
  const node = namehash.hash(name)
  const input = resolverContractInterface.encodeFunctionData('contenthash', [node])

  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return the content hash in text format
  const decodedOutput = resolverContractInterface.decodeFunctionResult('contenthash', [node])

  if (decodedOutput[0] === null) return null

  const hash = contentHash.decode(decodedOutput[0])
  // const type = contentHash.getCodec(decodedOutput[0])
  // if (type === 'ipfs-ns') return `ipfs://${hash}`
  // if (type === 'swarm-ns') return `bzz://${hash}`
  return hash
}

/* PRIVATE */
const getResolverAddress = async (name) => {
  // Hash name
  const hash = namehash.hash(name)

  // Get registry contract address for selected network
  const networkId = store('main.currentNetwork.id')
  const registryAddress = registryAddresses[networkId]

  // Encode function input
  const input = registryContractInterface.encodeFunctionData('resolver', [hash])

  // Make JSON RPC call
  const params = { to: registryAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return value
  const decodedOutput = registryContractInterface.decodeFunctionResult('resolver', output)
  return decodedOutput[0]
}

const makeCall = (method, params) => {
  return new Promise((resolve, reject) => {
    // Construct JSON RPC payload
    const payload = { jsonrpc: '2.0', id: 1, method: method, params: [params, 'latest'] }

    // Send payload to provider and resolve promise with result
    provider.send(payload, ({ result }) => resolve(result))
  })
}
