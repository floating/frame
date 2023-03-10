import { TransactionDescription } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import { addHexPrefix } from '@ethereumjs/util'
import provider from '../provider'
import { BigNumber } from 'ethers'
import { erc20Interface } from '../../resources/contracts'
export interface TokenData {
  decimals?: number
  name: string
  symbol: string
  totalSupply?: string
}

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
    this.contract = new Contract(address, erc20Interface, web3Provider)
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

  static decodeCallData(calldata: string) {
    try {
      return erc20Interface.parseTransaction({ data: calldata })
    } catch (e) {
      // call does not match ERC-20 interface
    }
  }

  static encodeCallData(fn: string, params: any[]) {
    return erc20Interface.encodeFunctionData(fn, params)
  }

  async getTokenData(): Promise<TokenData> {
    const calls = await Promise.all([
      this.contract.decimals().catch(() => 0),
      this.contract.name().catch(() => ''),
      this.contract.symbol().catch(() => ''),
      this.contract
        .totalSupply()
        .then((supply: BigNumber) => supply.toString())
        .catch(() => '') // totalSupply is mandatory on the ERC20 interface
    ])

    return {
      decimals: calls[0],
      name: calls[1],
      symbol: calls[2],
      totalSupply: calls[3]
    }
  }
}
