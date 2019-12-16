const evaluateRadSpec = require('../contracts/contractMetadata/evaluateRadSpec')

module.exports = {
  load: async rawTx => {
    const radspec = await evaluateRadSpec(rawTx)
    if (!radspec && rawTx.value && !rawTx.data) return { type: 'etherOnly', message: 'Sending Ether' }
    // ERC-20 Standard Tx
    // ERC-721 Standard Tx
    if (!radspec && rawTx.data && !rawTx.value) return { type: 'unknownData', message: 'Sending data, effect unknown' }
    return { type: 'custom', message: radspec }
  }
}
