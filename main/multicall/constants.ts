import type EthereumProvider from 'ethereum-provider'

export enum MulticallVersion {
  V1 = 1,
  V2 = 2,
}

export type CallResult<T> = { success: boolean; returnValues: T[] }
export type PostProcessor<R, T> = (val: R) => T

export interface MulticallConfig {
  address: Address
  chainId: number
  provider: EthereumProvider
  version: MulticallVersion
}

export interface Call<R, T> {
  target: Address
  call: string[]
  returns: [PostProcessor<R, T>]
}

export const abi = [
  'function aggregate(tuple(address target, bytes callData)[] calls) returns (uint256 blockNumber, bytes[] returndata)',
  'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) returns (tuple(bool success, bytes returndata)[] result)',
]

export const functionSignatureMatcher = /function\s+(?<signature>\w+)/

export const multicallAddresses: Record<number, { version: MulticallVersion; address: Address }> = {
  1: {
    version: MulticallVersion.V2,
    address: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // mainnet
  },
  3: {
    version: MulticallVersion.V2,
    address: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // ropsten
  },
  4: {
    version: MulticallVersion.V2,
    address: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // rinkeby
  },
  5: {
    version: MulticallVersion.V2,
    address: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // goerli
  },
  10: {
    version: MulticallVersion.V2,
    address: '0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4', // optimism
  },
  30: {
    version: MulticallVersion.V1,
    address: '0x6c62bf5440de2cb157205b15c424bceb5c3368f5', // RSK mainnet
  },
  31: {
    version: MulticallVersion.V1,
    address: '0x9e469e1fc7fb4c5d17897b68eaf1afc9df39f103', // RSK testnet
  },
  42: {
    version: MulticallVersion.V2,
    address: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // kovan
  },
  56: {
    version: MulticallVersion.V1,
    address: '0x41263cba59eb80dc200f3e2544eda4ed6a90e76c', // BSC mainnet
  },
  97: {
    version: MulticallVersion.V1,
    address: '0xae11c5b5f29a6a25e955f0cb8ddcc416f522af5c', // BSC testnet
  },
  100: {
    version: MulticallVersion.V1,
    address: '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a', // xdai
  },
  137: {
    version: MulticallVersion.V1,
    address: '0x11ce4b23bd875d7f5c6a31084f55fde1e9a87507', // polygon
  },
  42161: {
    version: MulticallVersion.V2,
    address: '0x7a8eaD64B79C466d8A9Bcfd2a7B7BF938F9Cb542',
  },
  80001: {
    version: MulticallVersion.V1,
    address: '0x08411add0b5aa8ee47563b146743c13b3556c9cc', // mumbai
  },
}
