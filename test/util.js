const { addHexPrefix } = require('@ethereumjs/util')

export const weiToHex = (wei) => addHexPrefix(wei.toString(16))
export const gweiToHex = (gwei) => weiToHex(gwei * 1e9)
export const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate)
