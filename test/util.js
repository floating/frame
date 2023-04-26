import { intToHex } from '@ethereumjs/util'

export const gweiToHex = (gwei) => intToHex(gwei * 1e9)
export const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate)

export function assertDone(test, done) {
  try {
    test()
    done()
  } catch (e) {
    done(e)
  }
}
