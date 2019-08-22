import mapping from './mapping.json';

const evaluateRadSpec = (transaction = { chainId: '0x1', data: '0x', to: '0x'}) => {
  const contractsInChain = mapping[chainId]
  if (!contractsInChain || Object.keys(contractsInChain).length = 0) return null
  const metaDataPath = contractsInChain[to]
  if (!metaDataPath) return null
  const metaData = require('./' + metaDataPath)
  // get signature from data
  // encode all userdoc signatures
  // compare sig from data with encoded userdoc signautres
  // get expression
  // const eva = await radspec.evaluate(expression, call)
}

export default evaluateRadSpec