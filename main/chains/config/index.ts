import { Common } from '@ethereumjs/common'

function chainConfig (chain: number, hardfork: string) {
  const chainId = BigInt(chain)

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId, hardfork })
    : Common.custom({ chainId }, { baseChain: 'mainnet', hardfork })
}

export default chainConfig
