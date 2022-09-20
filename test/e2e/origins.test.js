import provider from 'eth-provider'
import { hexToNumber, numberToHex } from 'web3-utils'

jest.mock('../../main/store/persist')

let frame

beforeEach(done => {
  frame = provider('frame', { origin: 'frame.test' })
  frame.once('connect', () => {
    frame.request({ method: 'eth_accounts', params: [] }).then(() => done())
  })
})

afterEach(() => {
  frame.removeAllListeners('chainChanged')
  frame.close()
})

it('should be able to change the chain for a given origin', async () => {
  const [chains, currentChainId] = await Promise.all([
    frame.request({ method: 'wallet_getEthereumChains' }),
    frame.request({ method: 'eth_chainId' })
  ])

  const targetChain = chains.find(c => c.chainId !== hexToNumber(currentChainId))

  if (!targetChain) throw new Error('no available chains to switch to!')

  return new Promise((resolve, reject) => {
    frame.on('chainChanged', async updatedChainId => {
      try {
        expect(updatedChainId).toBe(numberToHex(targetChain.chainId))

        const chainId = await frame.request({ method: 'eth_chainId' })
        expect(chainId).toBe(numberToHex(targetChain.chainId))
        resolve()
      } catch (e) { reject(e) }
    })
    
    frame.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChain.chainId }]
    })
  })
}, 5 * 1000)
