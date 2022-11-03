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

  unlock ({ encryptedSeed, password }: { encryptedSeed: string, password: Buffer }, cb: PseudoCallback) {
    try {
      this.seed = this._decrypt(encryptedSeed, password)
      cb()
    } catch (e) {
      cb(new Error('Invalid password'))
    }
  }

  lock (_payload: undefined, cb: PseudoCallback) {
    this.seed = undefined
    cb()
  }

  encryptSeed ({ seed, password }: { seed: Buffer, password: Buffer }, cb: PseudoCallback) {
    cb(undefined, this._encrypt(seed.toString('hex'), password))
  }

  signMessage ({ index, message }: { index?: number, message: string }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return cb(new Error('Signer locked'))
    // Derive private key
    const key = this.derivePrivateKey(index as number)
    // Sign message
    super.signMessage({ key, message }, cb)
  }

  signTypedData ({ index, typedMessage }: { index?: number, typedMessage: TypedMessage }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return cb(new Error('Signer locked'))
    // Derive private key
    const key = this.derivePrivateKey(index as number)
    // Sign message
    super.signTypedData({ key, typedMessage }, cb)
  }

  signTransaction ({ index, rawTx }: { index?: number, rawTx: TransactionData }, cb: PseudoCallback) {
    // Make sure signer is unlocked
    if (!this.seed) return cb(new Error('Signer locked'))
    // Derive private key
    const key = this.derivePrivateKey(index as number)
    // Sign transaction
    super.signTransaction({ key, rawTx }, cb)
  }

  verifyAddress ({ index, address }: { index: number, address: string }, cb: PseudoCallback) {
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
      cb(undefined, verifiedAddress.toLowerCase() === address.toLowerCase() ? 'true' : 'false')
    })
  }
}

export const seedSignerWorker = new SeedSignerWorker()
