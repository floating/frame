import crypto from 'crypto'
import { signTypedData as signEthTypedData } from '@metamask/eth-sig-util'
import { TransactionFactory } from '@ethereumjs/tx'
import { Common } from '@ethereumjs/common'
import {
  hashPersonalMessage,
  toBuffer,
  ecsign,
  addHexPrefix,
  pubToAddress,
  ecrecover
} from '@ethereumjs/util'

import type { TypedMessage } from '../../../accounts/types'
import type { TransactionData } from '../../../../resources/domain/transaction'
import type {
  HotSignerWorker,
  PseudoCallback,
  RPCMessage,
  WorkerRPCMessage,
  WorkerTokenMessage
} from './types'

interface IPC {
  send: (message: WorkerTokenMessage | WorkerRPCMessage) => void
  on: (msgType: 'message', handler: (message: RPCMessage) => void) => void
}

function chainConfig(chain: number, hardfork: string) {
  const chainId = BigInt(chain)

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId, hardfork })
    : Common.custom({ chainId: chainId }, { baseChain: 'mainnet', hardfork })
}

export function isHotSignerMethod(method: string) {
  return ['lock', 'unlock', 'signMessage', 'signTypedData', 'signTransaction'].includes(method)
}

export function signMessage(key: Buffer, message: string, cb: PseudoCallback<string>) {
  // Hash message
  const hash = hashPersonalMessage(toBuffer(message))

  // Sign message
  const signed = ecsign(hash, key)

  // Return serialized signed message
  const hex = Buffer.concat([signed.r, signed.s, Buffer.from([Number(signed.v)])]).toString('hex')

  cb(null, addHexPrefix(hex))
}

export function signTypedData(
  key: Buffer,
  typedMessage: TypedMessage,
  pseudoCallback: PseudoCallback<string>
) {
  try {
    const { data, version } = typedMessage
    const signature = signEthTypedData({ privateKey: key, data, version })
    pseudoCallback(null, signature)
  } catch (e) {
    pseudoCallback((e as Error).message)
  }
}

export function signTransaction(key: Buffer, rawTx: TransactionData, pseudoCallback: PseudoCallback<string>) {
  if (!rawTx.chainId) {
    console.error(`invalid chain id ${rawTx.chainId} for transaction`)
    return pseudoCallback('could not determine chain id for transaction')
  }

  const chainId = parseInt(rawTx.chainId, 16)
  const hardfork = parseInt(rawTx.type) === 2 ? 'london' : 'berlin'
  const common = chainConfig(chainId, hardfork)

  const tx = TransactionFactory.fromTxData(rawTx, { common })
  const signedTx = tx.sign(key)
  const serialized = signedTx.serialize().toString('hex')

  pseudoCallback(null, addHexPrefix(serialized))
}

export function encrypt(s: string, password: string) {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', hashPassword(password, salt) as Buffer, iv)
  const encrypted = Buffer.concat([cipher.update(s), cipher.final()])
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(s: string, password: string) {
  const parts = s.split(':')
  const salt = Buffer.from(parts.shift() as string, 'hex')
  const iv = Buffer.from(parts.shift() as string, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', hashPassword(password, salt) as Buffer, iv)
  const encryptedString = Buffer.from(parts.join(':'), 'hex')
  const decrypted = Buffer.concat([decipher.update(encryptedString), decipher.final()])
  return decrypted.toString()
}

export function hashPassword(password: string, salt: Buffer) {
  try {
    return crypto.scryptSync(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 36000000 })
  } catch (e) {
    console.error('Error during hashPassword', e) // TODO: Handle Error
  }
}

export class HotSignerWorkerController {
  private readonly token: string
  private readonly worker: HotSignerWorker
  private readonly ipc: IPC

  constructor(worker: HotSignerWorker, ipc: IPC) {
    this.worker = worker
    this.ipc = ipc

    ipc.on('message', (message: RPCMessage) => this.handleMessage(message))

    this.token = crypto.randomBytes(32).toString('hex')
    this.ipc.send({ type: 'token', token: this.token })
  }

  private handleMessage({ id, method, params, token }: RPCMessage) {
    // Define (pseudo) callback
    const pseudoCallback: PseudoCallback<unknown> = (error, result) => {
      // Add correlation id to response
      const response = { id, error: error || undefined, result, type: 'rpc' } as const
      // Send response to parent process
      this.ipc.send(response)
    }

    // Verify token
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(this.token))) {
      return pseudoCallback('Invalid token')
    }

    if (method === 'verifyAddress') {
      return this.verifyAddress(params, pseudoCallback)
    }

    this.worker.handleMessage(pseudoCallback, method, params)
  }

  verifyAddress(
    { index, address }: { index: number; address: string },
    pseudoCallback: PseudoCallback<boolean>
  ) {
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

    this.worker.signMessage(cb, { index, message })
  }
}
