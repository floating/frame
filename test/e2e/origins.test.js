import provider from 'eth-provider'

jest.mock('../../main/store/persist')

let frame

beforeEach(done => {
  frame = provider('frame', { origin: 'frame.test' })
  frame.once('connect', () => done())
}, 10 * 1000)

afterEach(() => {
  frame.removeAllListeners('chainChanged')
  frame.close()
})

it('should be able to change the chain for a given origin', done => {
  const chain = '0x4'

  frame.on('chainChanged', chainId => {
    try {
      expect(chainId).toBe(chain)
      done()
    } catch (e) { done.fail(e) }
  })
  
  frame.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: chain }]
  })
}, 30 * 1000)
