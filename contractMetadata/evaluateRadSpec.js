const { toChecksumAddress } = require('web3-utils')
const abiDecoder = require('abi-decoder')
const radspec = require('radspec')

const mapping = require('./mapping.json')
const openzeppelinContracts = require('./openzeppelin-contracts')

// TODO: Make async
const evaluateRadSpec = ({ chainId = '0x1', data = '0x', to = '0x'}, callback) => {
  const contractsInChain = mapping[chainId]
  if (!contractsInChain || Object.keys(contractsInChain).length === 0) return callback(null)
  const metaDataPath = contractsInChain[to] || contractsInChain[toChecksumAddress(to)]
  if (!metaDataPath) return callback(null)
  const metaData = openzeppelinContracts[metaDataPath]
  if (!metaData) return callback(null)
  abiDecoder.addABI(metaData.abi)
  const decoded = abiDecoder.decodeMethod(data)
  const signature = `${decoded.name}(${decoded.params.map(param => param.type).join(',')})`
  
  const expression = 
    metaData.userdoc && 
    metaData.userdoc.methods && 
    metaData.userdoc.methods[signature] &&
    metaData.userdoc.methods[signature].notice

  if (!expression) return callback(null)

  const call = {
    transaction: { data, to },
    abi: metaData.abi,
  }

  radspec.evaluate(expression, call).then(callback)
}

module.exports = evaluateRadSpec