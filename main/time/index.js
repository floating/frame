// Return Frame Time

const counts = {}

module.exports = async (blockNumber) => {
  if (!blockNumber) blockNumber = await provider.request({ method: 'eth_blockNumbr' })
  counts[blockNumber] = counts[blockNumber] || 0
  return blockNumber + ':' + counts[blockNumber]
}
