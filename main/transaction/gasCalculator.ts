import { RawTransaction } from './index'

const calculator = function (connection, defaultGasLevel) {
  function getGasPrice () {
    return defaultGasLevel
  }
  
  async function getGasEstimate (rawTx: RawTransaction) {

    const targetChain = {
      type: 'ethereum',
      id: rawTx.chainId
    }

    return new Promise((resolve, reject) => {
      connection.send({ id: 1, jsonrpc: '2.0', method: 'eth_estimateGas', params: [rawTx] }, response => {
        if (response.error) {
          reject(response.error)
        } else {
          resolve(response.result)
        }
      }, targetChain)
    })
  }
  
  function getMaxPriorityFeePerGas (rawTx: RawTransaction) {
    return '0x3b9aca00' // 1 gwei
  }
  
  function getMaxBaseFeePerGas (rawTx: RawTransaction) {
    return '0x32' // 50 wei
  }

  return {
    getGasPrice,
    getGasEstimate,
    getMaxPriorityFeePerGas,
    getMaxBaseFeePerGas,
  }
}

export default calculator
