const fetch = require('node-fetch')
const { id } = require('@ethersproject/hash')
const { defaultAbiCoder } = require('@ethersproject/abi')

module.exports = {
  decodeCalldata: async (contractAddress, calldata) => { 
    const res = await fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=3SYU5MW5QK8RPCJV1XVICHWKT774993S24`)
    const data = await res.json()
    if (data && data.message === 'OK' && data.result) {
      const abi = JSON.parse(data.result[0].ABI)
      const selector = calldata.slice(2, 10)
      const abiMethod = abi.find(abiItem => {
        if (abiItem.type === 'function') {
          const signature = `${abiItem.name}(${abiItem.inputs.map(input => input.type).join(',')})`
          return selector === id(signature).slice(2, 10)
        }
      })
      if (!abiMethod) log.error('No matching ABI method')
      const payload = `0x${calldata.slice(10, calldata.length)}`
      const types = abiMethod.inputs.map(input => input.type)
      const decoded = defaultAbiCoder.decode(types, payload)
      return {
        contractAddress,
        contractName: data.result[0].ContractName,
        source: 'etherscan',
        method: abiMethod.name,
        args: abiMethod.inputs.map((input, i) => ({ name: input.name, type: input.type, value: decoded[i].toString()}))
      }
    } else {
      log.error('Unable to decode data', data)
    }
  }
}
