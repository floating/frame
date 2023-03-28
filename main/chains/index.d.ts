import { Common } from '@ethereumjs/common'
import { EventEmitter } from 'stream'

export interface Chain {
  id: number
  type: 'ethereum'
}

// TODO move this into chains.js when it's converted to TS
declare class Chains extends EventEmitter {
  connections: {
    ethereum: {
      [chainId: string]: {
        chainId: string
        chainConfig: Common
        primary: {
          connected: boolean
        }
        secondary: {
          connected: boolean
        }
      }
    }
  }

  syncDataEmit(data: any): void
  send(payload: JSONRPCRequestPayload, cb: RPCRequestCallback, targetChain?: Chain): void
}

declare const chainConnection: Chains

export default chainConnection
