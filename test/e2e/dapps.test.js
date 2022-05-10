
import provider from 'eth-provider'
import store from '../../main/store'

jest.mock('../../main/store/persist')

const frame = provider('frame', { origin: 'frame.sh' })

it('should be able to change the chain', async done => {
  try {
    store.observer(() => {
      const chainId = store('main.dapps')
      console.log('got chain yo', chainId)
      if (chainId === '0x4') {
        done()
      }
    })
    console.log('requesting chain change')
    await frame.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x4' }],
      origin: 'https://frame.sh'
    })
    console.log('change requested')
    // verify chain changed only for that dapp
  } catch (err) {
    console.log(err)
  }
}, 30 * 1000)

// dapp requests permission
// - verify permission requested

// user grants permission
// - verify dapp receives perm decision
// - verify perm only granted for that dapp

// user denies permission
// - verify dapp receives perm decision
// - verify perm only granted for that dapp
