import Common from '@ethereumjs/common'

// TODO move this into chains.js when it's converted to TS
export default interface ChainConnection extends EventEmitter {
  syncDataEmit: Function,
  connections: {
    ethereum: {
      [chainId: number]: {
        chainConfig: Common
      }
    }
  }
}
