const { toChecksumAddress } = require('web3-utils')
const abiDecoder = require('abi-decoder')
const radspec = require('radspec')
const Web3 = require('web3')
const mapping = require('./mapping.json')
const contracts = require('./contracts')

const evaluateRadSpec = async ({ chainId = '0x1', data = '0x', to = '0x'}) => {
  const web3 = new Web3(require('../main/provider'));
  const contractsInChain = mapping[chainId]
  if (!contractsInChain || Object.keys(contractsInChain).length === 0) return null
  const metaDataPath = contractsInChain[to] || contractsInChain[toChecksumAddress(to)]
  var metaData = null 
  if (metaDataPath){
    metaData = await contracts(metaDataPath,to,web3)
  }else{
    const code = await web3.eth.getCode(to)
    if(mapping.code[code]) metaData = await contracts(mapping.code[code],to,web3);
  }
  if (!metaData) return null
  abiDecoder.addABI(metaData.abi)
  const decoded = abiDecoder.decodeMethod(data)
  if (!decoded) return null
  const signature = `${decoded.name}(${decoded.params.map(param => param.type).join(',')})`
  
  const expression = 
    metaData.userdoc && 
    metaData.userdoc.methods && 
    metaData.userdoc.methods[signature] &&
    metaData.userdoc.methods[signature].notice

  if (!expression) return null

  const call = {
    transaction: { data, to },
    abi: metaData.abi,
  }

  return await radspec.evaluate(expression, call, {eth: web3.eth})
}

module.exports = evaluateRadSpec
