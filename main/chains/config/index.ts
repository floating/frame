import { BN, stripHexPrefix } from 'ethereumjs-util'
import Common from '@ethereumjs/common'

const londonHardforkSigners = ['seed', 'ring']

function chainConfig (chain: string, hardfork: string) {
  const chainId = new BN(stripHexPrefix(chain), 'hex')

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId.toNumber(), hardfork })
    : Common.forCustomChain('mainnet', { chainId: chainId.toNumber() }, hardfork)
}

async function resolveChainConfig (provider: any, chain: string, signerType: string, blockNumber: number, hardfork = 'berlin') {
  const common = chainConfig(chain, hardfork)

  return new Promise(resolve => {
    if (blockNumber && londonHardforkSigners.includes(signerType)) {
      provider.send({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }, (response: any) => {
        if (!response.error) {
          const blockNumber = response.result
          common.setHardforkByBlockNumber(blockNumber)
        }
        resolve(common)
      })
    } else {
      resolve(common)
    }
  })
}

export {
  chainConfig,
  resolveChainConfig
}
