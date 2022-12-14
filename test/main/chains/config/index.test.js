import chainConfig from '../../../../main/chains/config'

describe('polygon', () => {
  it('sets the chain id', () => {
    const config = chainConfig(137)

    expect(config.chainId()).toBe(BigInt(137))
  })

  it('sets EIP-1559 to be disabled by default', () => {
    const config = chainConfig(137, 'istanbul')

    expect(config.gteHardfork('london')).toBe(false)
  })
})
