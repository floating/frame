import { TransactionDescription } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import { addHexPrefix } from '@ethereumjs/util'
import log from 'electron-log'
import erc20Abi from '../externalData/balances/erc-20-abi'
import provider from '../provider'
import { isAddress } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

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
    const [spender, value] = data.args
    return (
      data.name === 'approve' && data.args.length === 2 && isAddress(spender) && value instanceof BigNumber
    )
  }

  static isTransfer(data: TransactionDescription) {
    const [to, value] = data.args
    return (
      data.name === 'transfer' &&
      data.functionFragment.inputs.length === 2 &&
      isAddress(to) &&
      value instanceof BigNumber
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
