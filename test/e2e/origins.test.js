import provider from 'eth-provider'

jest.mock('../../main/store/persist')

let frame

beforeEach(done => {
  frame = provider('frame', { origin: 'frame.test' })
  frame.once('connect', () => {
    frame.request({ method: 'eth_accounts', params: [] }).then(() => done())
  })
}, 10 * 1000)

afterEach(() => {
  frame.removeAllListeners('chainChanged')
  frame.close()
})

it('should be able to change the chain for a given origin', async () => {
  const [chains, currentChain] = await Promise.all([
    frame.request({ method: 'wallet_getChains' }),
    frame.request({ method: 'eth_chainId' })
  ])

  const targetChain = chains.find(c => c !== currentChain)

  if (!targetChain) throw new Error('no available chains to switch to!')

  return new Promise((resolve, reject) => {
    frame.on('chainChanged', async updatedChainId => {
      try {
        expect(updatedChainId).toBe(targetChain)

        const chainId = await frame.request({ method: 'eth_chainId' })
        expect(chainId).toBe(targetChain)
        resolve()
      } catch (e) { reject(e) }
    })
    
    frame.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChain }]
    })
  })
}, 5 * 1000)
