import { BN, stripHexPrefix } from 'ethereumjs-util'
import Common from '@ethereumjs/common'

const londonHardforkSigners = ['seed', 'ring']

function chainConfig (chain: string, hardfork: string) {
  const chainId = new BN(stripHexPrefix(chain), 'hex')

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId.toNumber(), hardfork })
    : Common.forCustomChain('mainnet', { chainId: chainId.toNumber() }, hardfork)
}

async function resolveChainConfig (provider: any, chain: string, signerType: string, hardfork = 'berlin') {
  const common = chainConfig(chain, hardfork)

  if (!londonHardforkSigners.includes(signerType)) return common

  return new Promise(resolve => {
    provider.send({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }, (response: any) => {
      if (!response.error) {
        const blockNumber = response.result
        common.setHardforkByBlockNumber(blockNumber)
      }

      resolve(common)
    })
  })
}

export {
  chainConfig,
  resolveChainConfig
}
