import { addHexPrefix } from '@ethereumjs/util/dist'
import { getMaxTotalFee } from '../../../resources/gas'

describe('#getMaxTotalFee', () => {
  it('sets the max fee as 2 ETH on mainnet', () => {
    const tx = {
      chainId: addHexPrefix((1).toString(16))
    }

    expect(getMaxTotalFee(tx)).toBe(2e18)
  })

  it('sets the max fee as 14000 FTM on Fantom', () => {
    const tx = {
      chainId: addHexPrefix((250).toString(16))
    }

    expect(getMaxTotalFee(tx)).toBe(14000e18)
  })

  it('sets the max fee as 10000000 PLS on PulseChain', () => {
    const tx = {
      chainId: addHexPrefix((369).toString(16))
    }

    expect(getMaxTotalFee(tx)).toBe(1e25)
  })

  it('sets the max fee as 500 on other chains', () => {
    const tx = {
      chainId: addHexPrefix((255).toString(16))
    }

    expect(getMaxTotalFee(tx)).toBe(5e20)
  })
})
