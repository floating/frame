import { decodeCallData as decodeContractData, DecodedCallData } from '.'
import { Interface } from '@ethersproject/abi'
import erc20 from '../externalData/balances/erc-20-abi'
import { Provider } from '../provider'

const erc20Abi = JSON.stringify(erc20)
const erc20Interface = new Interface(erc20)

function decodeCallData (contractAddress: Address, calldata: string) {
  const decodedCall = decodeContractData(calldata, erc20Abi)

  if (decodedCall) {
    return {
      contractAddress: contractAddress.toLowerCase(),
      contractName: 'ERC-20',
      source: 'erc-20 contract',
      ...decodedCall
    }
  }
}

function isApproval (data: DecodedCallData) {
  return (
    data.method === 'approve' &&
    data.args.length === 2 &&
    (data.args[0].name || '').toLowerCase().endsWith('spender') && data.args[0].type === 'address' &&
    (data.args[1].name || '').toLowerCase().endsWith('value') && data.args[1].type === 'uint256'
  )
}

async function getDecimals (provider: Provider, contractAddress: Address) {
  const calldata = erc20Interface.encodeFunctionData('decimals')

  return new Promise<number>(resolve => {
    provider.send({
      id: 1,
      jsonrpc: '2.0',
      _origin: 'frame.eth',
      method: 'eth_call',
      params: [
        {
          to: contractAddress,
          data: calldata,
          value: '0x0'
        }, 'latest'
      ]
    }, res => resolve(res.result ? parseInt(res.result, 16) : 0))
  })

  // if the contract doesnt provide decimals, try to get the data from Etherscan
}

function encodeFunctionData (fn: string, params: any[]) {
  return erc20Interface.encodeFunctionData(fn, params)
}

export default {
  encodeFunctionData,
  decodeCallData,
  getDecimals,
  isApproval
}
