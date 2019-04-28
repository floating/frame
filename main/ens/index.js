const { Contract } = require('web3-eth-contract')
const { AbiCoder } = require('web3-eth-abi')
const namehash = require('eth-ens-namehash')
const provider = require('../provider')
const { registryInterface, resolverInterface } = require('./abi.js')

const address = {
  mainnet: '0x314159265dd8dbb310642f98f50c066173c1259b'
}

const coder = new AbiCoder()

const contract = new Contract("http://dummy", registryInterface)
const hash = namehash.hash('ethereum.eth')
console.log(hash)
const abi = contract.methods.resolver(hash).encodeABI()
const params = {
  to: address.mainnet,
  data: abi
}

setTimeout( () => {
  console.log("Sending")
  const payload = { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [params, "latest"] }
  provider.send(payload, ({ result }) => {
    console.log(coder.decodeParameter('address', result))
  })
}, 3000)