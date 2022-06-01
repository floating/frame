import { TransactionDescription } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import log from 'electron-log'
import erc20Abi from '../externalData/balances/erc-20-abi'
import type { Provider } from '../provider'

function createWeb3ProviderWrapper (chainId: string, provider: Provider) {
  const wrappedSend = (request: { method: string, params?: any[] }, cb: (error: any, response: any) => void) => {
    provider.sendAsync({
      method: request.method,
      params: request.params || [],
      id: 1,
      jsonrpc: '2.0',
      _origin: 'frame.eth',
      chainId
    }, cb)
  }

  return {
    sendAsync: wrappedSend,
    send: wrappedSend
  }
}

export default class Erc20Contract {
  private contract: Contract

  constructor (address: Address, chainId: string, provider: Provider) {
    const web3Provider = new Web3Provider(createWeb3ProviderWrapper(chainId, provider))
    this.contract = new Contract(address, erc20Abi, web3Provider)
  }

  static isApproval (data: TransactionDescription) {
    return (
      data.name === 'approve' &&
      data.functionFragment.inputs.length === 2 &&
      (data.functionFragment.inputs[0].name || '').toLowerCase().endsWith('spender') && data.functionFragment.inputs[0].type === 'address' &&
      (data.functionFragment.inputs[1].name || '').toLowerCase().endsWith('value') && data.functionFragment.inputs[1].type === 'uint256'
    )
  }

  decodeCallData (calldata: string) {
    try {
      return this.contract.interface.parseTransaction({ data: calldata })
    } catch (e) {
      // call does not match ERC-20 interface
    }
  }

  encodeCallData (fn: string, params: any[]) {
    return this.contract.interface.encodeFunctionData(fn, params)
  }
  
  async getTokenData () {
    try {
      const calls = await Promise.all([
        this.contract.decimals(),
        this.contract.name(),
        this.contract.symbol()
      ])

      return {
        decimals: calls[0],
        name: calls[1],
        symbol: calls[2]
      }
    } catch (e) {
      log.error(`getTokenData error: ${e}`)
      return {
        decimals: 0,
        name: '',
        symbol: ''
      }
    }
  }
}
