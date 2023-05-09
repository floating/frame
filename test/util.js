import { intToHex } from '@ethereumjs/util'

export const gweiToHex = (gwei) => intToHex(gwei * 1e9)
export const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate)

export async function withPlatform(platform, test) {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', {
    value: platform
  })

  await test()

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })
}
