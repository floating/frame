import { TransactionDescription } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import { addHexPrefix, zeroAddress } from '@ethereumjs/util'
import log from 'electron-log'
import erc20Abi from '../externalData/balances/erc-20-abi'
import provider from '../provider'

const takeDefaultIfRejected = <T>(promise: PromiseSettledResult<T>, defaultValue: 0 | '' | null) =>
  promise.status === 'fulfilled' ? promise.value : defaultValue

function createWeb3ProviderWrapper(chainId: number) {
  const wrappedSend = (
    request: { method: string; params?: any[] },
    cb: (error: any, response: any) => void
  ) => {
    const wrappedPayload = {
      method: request.method,
      params: request.params || [],
      id: 1,
      jsonrpc: '2.0',
      _origin: 'frame-internal',
      chainId: addHexPrefix(chainId.toString(16))
    } as const

    provider.sendAsync(wrappedPayload, cb)
  }

  return {
    sendAsync: wrappedSend,
    send: wrappedSend
  }
}

export default class Erc20Contract {
  private contract: Contract

  constructor(address: Address, chainId: number) {
    const web3Provider = new Web3Provider(createWeb3ProviderWrapper(chainId))
    this.contract = new Contract(address, erc20Abi, web3Provider)
  }

  static isApproval(data: TransactionDescription) {
    return (
      data.name === 'approve' &&
      data.functionFragment.inputs.length === 2 &&
      (data.functionFragment.inputs[0].name || '').toLowerCase().endsWith('spender') &&
      data.functionFragment.inputs[0].type === 'address' &&
      (data.functionFragment.inputs[1].name || '').toLowerCase().endsWith('value') &&
      data.functionFragment.inputs[1].type === 'uint256'
    )
  }

  static isTransfer(data: TransactionDescription) {
    return (
      data.name === 'transfer' &&
      data.functionFragment.inputs.length === 2 &&
      (data.functionFragment.inputs[0].name || '').toLowerCase().endsWith('to') &&
      data.functionFragment.inputs[0].type === 'address' &&
      (data.functionFragment.inputs[1].name || '').toLowerCase().endsWith('value') &&
      data.functionFragment.inputs[1].type === 'uint256'
    )
  }

  decodeCallData(calldata: string) {
    try {
      return this.contract.interface.parseTransaction({ data: calldata })
    } catch (e) {
      // call does not match ERC-20 interface
    }
  }

  encodeCallData(fn: string, params: any[]) {
    return this.contract.interface.encodeFunctionData(fn, params)
  }

  async getTokenData() {
    const calls = await Promise.allSettled([
      this.contract.decimals(),
      this.contract.name(),
      this.contract.symbol(),
      this.contract.totalSupply() //totalSupply is mandatory on the ERC20 interface
    ])

    const totalSupply = calls[3].status === 'fulfilled' ? calls[3].value.toString() : ''
    return {
      decimals: takeDefaultIfRejected(calls[0], 0),
      name: takeDefaultIfRejected(calls[1], ''),
      symbol: takeDefaultIfRejected(calls[2], ''),
      totalSupply
    }
  }
}
