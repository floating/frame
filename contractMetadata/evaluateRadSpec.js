import { toChecksumAddress } from 'web3-utils'
import abiDecoder from 'abi-decoder'
// import radspec from 'radspec'

import mapping from './mapping.json'
import openzeppelinContracts from './openzeppelin-contracts';

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

  // radspec.evaluate(expression, { data, to }).then(callback)
  
}

export default evaluateRadSpec