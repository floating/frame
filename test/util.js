import { bigIntToHex } from '@ethereumjs/util'
import BigNumber from 'bignumber.js'

export const gweiToHex = (gwei) => `0x${BigNumber(gwei).times(BigNumber(1e9)).toString(16)}`
export const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate)

export function assertDone(test, done) {
  try {
    test()
    done()
  } catch (e) {
    done(e)
  }
}
