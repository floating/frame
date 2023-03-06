import crypto from 'crypto'
import { hashPersonalMessage, toBuffer, pubToAddress, ecrecover } from '@ethereumjs/util'

import type {
  HotSignerWorker,
  PseudoCallback,
  RPCMessage,
  WorkerRPCMessage,
  WorkerTokenMessage
} from '../types'

interface IPC {
  send: (message: WorkerTokenMessage | WorkerRPCMessage) => void
  on: (msgType: 'message', handler: (message: RPCMessage) => void) => void
}

export default function (worker: HotSignerWorker, ipc: IPC) {
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
    pseudoCallback: PseudoCallback<boolean>
  ) => {
    const message = '0x' + crypto.randomBytes(32).toString('hex')
    const cb: PseudoCallback<string> = (err, msg) => {
      // Handle signing errors
      if (err) return pseudoCallback(err)
      // Signature -> buffer
      const signedMessage = msg as string
      const signature = Buffer.from(signedMessage.replace('0x', ''), 'hex')
      // Ensure correct length
      if (signature.length !== 65) return pseudoCallback('Frame verifyAddress signature has incorrect length')
      // Verify address
      const vNum = signature[64]

      const v = BigInt(vNum === 0 || vNum === 1 ? vNum + 27 : vNum)
      const r = toBuffer(signature.slice(0, 32))
      const s = toBuffer(signature.slice(32, 64))
      const hash = hashPersonalMessage(toBuffer(message))
      const verifiedAddress = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')

      // Return result
      pseudoCallback(null, verifiedAddress.toLowerCase() === address.toLowerCase())
    }

    worker.signMessage(cb, { index, message })
  }

  ipc.on('message', handleMessage)
  ipc.send({ type: 'token', token: workerToken })
}
