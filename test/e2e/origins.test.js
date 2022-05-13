import provider from 'eth-provider'

jest.mock('../../main/store/persist')

const frame = provider('frame', { origin: 'frame.test' })

it('should be able to change the chain for a given origin', (done) => {
  try {
    (async () => {
      await frame.request({
        method: 'eth_accounts',
        params: [],
        origin: 'frame.test'
      })
      const chainChangedListener = (chainId) => {
        expect(chainId).toBe('0x4')
        done()
      }
      frame.on('chainChanged', chainChangedListener)
      await frame.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x4' }],
        origin: 'frame.test'
      })
      frame.off('chainChanged', chainChangedListener)
      frame.close()
    })()
  } catch (err) {
    console.log(err)
  }
}, 30 * 1000)
