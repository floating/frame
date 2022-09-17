import { BN } from 'ethereumjs-util'
import Common from '@ethereumjs/common'

function chainConfig (chain: number, hardfork: string) {
  const chainId = new BN(chain)

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId.toNumber(), hardfork })
    : Common.custom({ chainId: chainId.toNumber() }, { baseChain: 'mainnet', hardfork })
}

export default chainConfig
