import { validateMnemonic, mnemonicToSeed } from 'bip39'
import hdKey from 'hdkey'
import { utils } from 'ethers'

import HotSigner from '../HotSigner'

import type { HotSignerData } from '..'

export interface SeedSignerData extends HotSignerData {
  encryptedSeed: string
}

export default class SeedSigner extends HotSigner {
  private encryptedSeed = ''

  static fromStoredData(data: Omit<SeedSignerData, 'type'>) {
    const signer = new SeedSigner()

    signer.encryptedSeed = data.encryptedSeed
    signer.addresses = data.addresses
    signer.update()

    return signer
  }

  constructor() {
    super('seed')

    this.model = 'phrase'
  }

  addSeed(seed: string, password: string, cb: ErrorOnlyCallback) {
    if (this.encryptedSeed) return cb(new Error('This signer already has a seed'))

    this.callWorker({ method: 'encryptSeed', params: { seed, password } }, (err, encryptedSeed) => {
      if (err) return cb(err)

      // Derive addresses
      const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex'))

      const addresses = []
      for (let i = 0; i < 100; i++) {
        const publicKey = wallet.derive("m/44'/60'/0'/0/" + i).publicKey
        const address = utils.computeAddress(publicKey)
        addresses.push(address)
      }

      // Update signer
      this.encryptedSeed = encryptedSeed as string
      this.addresses = addresses
      this.update()
      this.unlock(password, cb)
    })
  }

  async addPhrase(phrase: string, password: string, cb: ErrorOnlyCallback) {
    // Validate phrase
    if (!validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase'))
    // Get seed
    const seed = await mnemonicToSeed(phrase)
    // Add seed to signer
    this.addSeed(seed.toString('hex'), password, cb)
  }

  protected save() {
    super.save({ encryptedSeed: this.encryptedSeed })
  }

  unlock(password: string, cb: ErrorOnlyCallback) {
    super.unlockWorker(password, { encryptedSecret: this.encryptedSeed }, cb)
  }
}
