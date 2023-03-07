import crypto from 'crypto'

import { verifySignedMessage } from '.'

import type {
  HotSignerMessageHandler,
  PseudoCallback,
  RPCMessage,
  WorkerRPCMessage,
  WorkerTokenMessage
} from '../types'

interface IPC {
  send: (message: WorkerTokenMessage | WorkerRPCMessage) => void
  on: (msgType: 'message', handler: (message: RPCMessage) => void) => void
}

export default function (worker: HotSignerMessageHandler, ipc: IPC) {
  const workerToken = crypto.randomBytes(32).toString('hex')

  const handleMessage = ({ id, method, params, token }: RPCMessage) => {
    // Define (pseudo) callback
    const pseudoCallback: PseudoCallback<unknown> = (error, result) => {
      // Add correlation id to response
      const response = { id, error: error || undefined, result, type: 'rpc' } as const
      // Send response to parent process
      ipc.send(response)
    }

    // Verify token
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(workerToken))) {
      return pseudoCallback('Invalid token')
    }

    if (method === 'verifyAddress') {
      return verifyAddress(params, pseudoCallback)
    }

    worker.handleMessage(pseudoCallback, method, params)
  }

  const verifyAddress = (
    { index, address }: { index: number; address: string },
    pseudoCallback: PseudoCallback<unknown>
  ) => {
    const message = '0x' + crypto.randomBytes(32).toString('hex')
    const cb: PseudoCallback<unknown> = (err, msg) => {
      // Handle signing errors
      if (err) return pseudoCallback(err)

      const signedMessage = msg as string
      const signature = Buffer.from(signedMessage.replace('0x', ''), 'hex')
      if (signature.length !== 65) return pseudoCallback('Frame verifyAddress signature has incorrect length')

      const verified = verifySignedMessage(address, message, signature)

      pseudoCallback(null, verified)
    }

    worker.handleMessage(cb, 'signMessage', { index, message })
  }

  ipc.on('message', handleMessage)
  ipc.send({ type: 'token', token: workerToken })
}
