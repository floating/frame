import path from 'path'
import bip39 from 'bip39'
import hdKey from 'hdkey'
//@ts-ignore
import publicKeyToAddress from 'ethereum-public-key-to-address'

import { HotSigner, SignerData, StoredSigner } from '../HotSigner'
import Signer from '../../Signer'

const WORKER_PATH = path.resolve(__dirname, 'worker.js')

export class SeedSigner extends HotSigner {
  protected encryptedSeed = ''
  public type = 'seed'
  public model = 'phrase'

  constructor (signer?: StoredSigner) {
    super(WORKER_PATH, signer)
    this.encryptedSeed = signer?.encryptedSeed || ''
    if (this.encryptedSeed) this.update()
  }

  addSeed (seed: string, password: string, cb: Callback<Signer>) {
    if (this.encryptedSeed) return cb(new Error('This signer already has a seed'))

    this.callWorker({ method: 'encryptSeed', params: { seed, password } }, (err: Error | null, encryptedSeed?: string) => {
      if (err) return cb(err)

      // Derive addresses
      const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex'))

      const addresses = []
      for (let i = 0; i < 100; i++) {
        const publicKey = wallet.derive('m/44\'/60\'/0\'/0/' + i).publicKey
        const address = publicKeyToAddress(publicKey)
        addresses.push(address)
      }

      // Update signer
      this.encryptedSeed = encryptedSeed as string
      this.addresses = addresses
      this.update()

      cb(null)
    })
  }

  async addPhrase (phrase: string, password: string, cb: Callback<Signer>) {
    // Validate phrase
    if (!bip39.validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase'))
    // Get seed
    const seed = await bip39.mnemonicToSeed(phrase)
    // Add seed to signer
    this.addSeed(seed.toString('hex'), password, cb)
  }

  save () {
    super.save({ encryptedSeed: this.encryptedSeed })
  }

  unlock (password: string, _data: SignerData, cb: Callback<Signer>) {
    super.unlock(password, { encryptedSeed: this.encryptedSeed }, cb)
  }
}
