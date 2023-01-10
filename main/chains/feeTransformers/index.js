const { gweiToWei } = require('../../../resources/utils')
const { intToHex } = require('@ethereumjs/util')

export default {
  137: (gasFees) => {
    const minimumMaxPriority = gweiToWei(30)
    const { maxPriorityFeePerGas, maxBaseFeePerGas } = gasFees
    if (minimumMaxPriority > parseInt(maxPriorityFeePerGas, 16)) {
      console.log({ maxPriorityFeePerGas })
      const maxFeePerGas = intToHex(minimumMaxPriority + parseInt(maxBaseFeePerGas, 16))
      return { ...gasFees, maxPriorityFeePerGas: intToHex(minimumMaxPriority), maxFeePerGas }
    }

    return gasFees
  }
}
