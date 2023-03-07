import crypto from 'crypto'

import { verifySignedMessage } from '.'

import type {
  HotSignerMessageHandler,
  PseudoCallback,
  RPCMessage,
  RPCMethod,
  WorkerRPCMessage,
  WorkerTokenMessage
} from '../types'

interface IPC {
  send: (message: WorkerTokenMessage | WorkerRPCMessage) => void
  on: (msgType: 'message', handler: (message: RPCMessage) => void) => void
}

function processMessage(method: RPCMethod, params: any, cb: PseudoCallback<unknown>) {
  if (method === 'verifyAddress') {
    const { index, address } = params
    const message = '0x' + crypto.randomBytes(32).toString('hex')

    const callback: PseudoCallback<unknown> = (err, msg) => {
      // Handle signing errors
      if (err) return cb(err)

      const signedMessage = msg as string
      const signature = Buffer.from(signedMessage.replace('0x', ''), 'hex')
      if (signature.length !== 65) return cb('Frame verifyAddress signature has incorrect length')

      const verified = verifySignedMessage(address, message, signature)

      cb(null, verified)
    }

    return { method: 'signMessage', params: { index, message }, callback } as const
  }

  return { method, params, callback: cb } as const
}

export default function (worker: HotSignerMessageHandler, ipc: IPC) {
  const workerToken = crypto.randomBytes(32).toString('hex')

  const isTokenValid = (token: string) => crypto.timingSafeEqual(Buffer.from(token), Buffer.from(workerToken))

  const handleMessage = ({ id, method: rpcMethod, params: rpcParams, token }: RPCMessage) => {
    const pseudoCallback: PseudoCallback<unknown> = (error, result) => {
      // Add correlation id to response
      const response = { id, error: error || undefined, result, type: 'rpc' } as const

      // Send response to parent process
      ipc.send(response)
    }

    // Verify token
    if (!isTokenValid(token)) {
      return pseudoCallback('Invalid token')
    }

    const { method, params, callback } = processMessage(rpcMethod, rpcParams, pseudoCallback)

    worker.handleMessage(callback, method, params)
  }

  ipc.on('message', handleMessage)
  ipc.send({ type: 'token', token: workerToken })
}
