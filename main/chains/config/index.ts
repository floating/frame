import { BN, stripHexPrefix, addHexPrefix } from 'ethereumjs-util'
import Common from '@ethereumjs/common'

const londonHardforkSigners = ['seed', 'ring']

// because the gas market for EIP-1559 will take a few blocks to
// stabilize, don't support these transactions until after the buffer period
const londonHardforkAdoptionBufferBlocks = 120

function chainConfig (chain: string, hardfork: string) {
  const chainId = new BN(stripHexPrefix(chain), 'hex')

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId.toNumber(), hardfork })
    : Common.custom({ chainId: chainId.toNumber() }, { baseChain: 'mainnet', hardfork })
}

async function resolveChainConfig (chains: any /* Chains */, signerType: string, chainId: string, networkType = 'ethereum') {
  const common = chains.connections[networkType][parseInt(chainId)].chainConfig

  if (!londonHardforkSigners.includes(signerType)) return common

  return new Promise(resolve => {
    chains.send({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }, (response: any) => {
      if (!response.error) {
        const currentBlock = response.result
        const targetBlock = addHexPrefix((parseInt(currentBlock, 16) - londonHardforkAdoptionBufferBlocks).toString(16))

        common.setHardforkByBlockNumber(targetBlock)
      }

      resolve(common)
    })
  })
}

export {
  chainConfig,
  resolveChainConfig
}
