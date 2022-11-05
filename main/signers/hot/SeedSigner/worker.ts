import hdKey from 'hdkey'
import crypto from 'crypto'
import {
  hashPersonalMessage,
  toBuffer,
  pubToAddress,
  ecrecover
} from 'ethereumjs-util'
import { TransactionData } from '../../../../resources/domain/transaction'
import { TypedMessage } from '../../../accounts/types'
import { HotSignerWorker, Message, PseudoCallback } from '../HotSigner/worker'

class SeedSignerWorker extends HotSignerWorker {
  private seed?: string
  public type = 'seed'

  constructor () {
    super()
    process.on('message', (message: Message) => this.handleMessage(message))
  }

  private derivePrivateKey (index: number) {
    let key = hdKey.fromMasterSeed(Buffer.from(this.seed as string, 'hex'))
    key = key.derive('m/44\'/60\'/0\'/0/' + index)
    return key.privateKey
  }

  unlock ({ encryptedSeed, password }: { encryptedSeed?: string, password?: Buffer }, cb: PseudoCallback) {
    try {
      this.seed = this._decrypt(encryptedSeed as string, password as Buffer)
      cb(null)
    } catch (e) {
      cb(new Error('Invalid password'))
    }
  }

  lock (_payload: unknown, cb: PseudoCallback) {
    this.seed = undefined
    cb(null)
  }

  encryptSeed ({ seed, password }: { seed?: Buffer, password?: Buffer }, cb: PseudoCallback) {
    cb(null, this._encrypt((seed as Buffer).toString('hex'), password as Buffer))
  }

  signMessage ({ index, message }: { index?: number, message?: string }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return cb(new Error('Signer locked'))
    // Derive private key
    const key = this.derivePrivateKey(index as number)
    // Sign message
    super.signMessage({ key, message }, cb)
  }

  signTypedData ({ index, typedMessage }: { index?: number, typedMessage?: TypedMessage }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return cb(new Error('Signer locked'))
    // Derive private key
    const key = this.derivePrivateKey(index as number)
    // Sign message
    super.signTypedData({ key, typedMessage }, cb)
  }

  signTransaction ({ index, rawTx }: { index?: number, rawTx?: TransactionData }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return cb(new Error('Signer locked'))
    // Derive private key
    const key = this.derivePrivateKey(index as number)
    // Sign transaction
    super.signTransaction({ key, rawTx }, cb)
  }

  verifyAddress ({ index, address }: { index?: number, address?: string }, cb: PseudoCallback) {
    const message = '0x' + crypto.randomBytes(32).toString('hex')
    this.signMessage({ index, message }, (err, signedMessage) => {
      // Handle signing errors
      if (err) return cb(err)
      // Signature -> buffer
      const signature = Buffer.from((signedMessage as string).replace('0x', ''), 'hex')
      // Ensure correct length
      if (signature.length !== 65) return cb(new Error('Frame verifyAddress signature has incorrect length'))
      // Verify address
      let v = signature[64]
      v = v === 0 || v === 1 ? v + 27 : v
      const r = toBuffer(signature.slice(0, 32))
      const s = toBuffer(signature.slice(32, 64))
      const hash = hashPersonalMessage(toBuffer(message))
      const verifiedAddress = '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
      // Return result
      cb(null, verifiedAddress.toLowerCase() === (address as string).toLowerCase() ? 'true' : 'false')
    })
  }

  handleMessage ({ id, method, params, token }: Message) {
    // Define (pseudo) callback
    const pseudoCallback = (error: Error | null, result?: string) => {
      // Add correlation id to response
      const response = { id, error, result, type: 'rpc' }
      console.log('handleMessage cb', response)
      // Send response to parent process
      if (process.send) {
        process.send(response)
      }
    }
    // Verify token
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(this.token))) return pseudoCallback(new Error('Invalid token'))
    // If method exists -> execute
    const callableMethods = {
      signMessage: this.signMessage.bind(this), 
      signTypedData: this.signTypedData.bind(this),
      signTransaction: this.signTransaction.bind(this),
      verifyAddress: this.verifyAddress.bind(this),
      encryptSeed: this.encryptSeed.bind(this),
      lock: this.lock.bind(this),
      unlock: this.unlock.bind(this)
    }
    const methodToCall = callableMethods[method as keyof typeof callableMethods]
    if (methodToCall) return methodToCall(params, pseudoCallback)
    // Else return error
    pseudoCallback(new Error(`Invalid method: '${method}'`))
  }
}

export const seedSignerWorker = new SeedSignerWorker()
