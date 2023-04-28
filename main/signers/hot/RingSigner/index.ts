import log from 'electron-log'
import Wallet from 'ethereumjs-wallet'

import HotSigner from '../HotSigner'

import type { HotSignerData } from '..'

export interface RingSignerData extends HotSignerData {
  encryptedKeys: string
}

export default class RingSigner extends HotSigner {
  private encryptedKeys = ''

  static fromStoredData(data: Omit<RingSignerData, 'type'>) {
    const signer = new RingSigner()

    signer.encryptedKeys = data.encryptedKeys
    signer.addresses = data.addresses
    signer.update()

    return signer
  }

  constructor() {
    super('ring')

    this.model = 'keyring'
  }

  protected save() {
    super.save({ encryptedKeys: this.encryptedKeys })
  }

  unlock(password: string, cb: ErrorOnlyCallback) {
    super.unlockWorker(password, { encryptedSecret: this.encryptedKeys }, cb)
  }

  addPrivateKey(key: string, password: string, cb: ErrorOnlyCallback) {
    // Validate private key
    let wallet
    try {
      wallet = Wallet.fromPrivateKey(Buffer.from(key, 'hex'))
    } catch (e) {
      return cb(new Error('Invalid private key'))
    }

    const address = wallet.getAddressString()

    // Ensure private key hasn't already been added
    if (this.addresses.includes(address)) {
      return cb(new Error('Private key already added'))
    }

    // Call worker
    const params = { encryptedKeys: this.encryptedKeys, key, password }
    this.callWorker({ method: 'addKey', params }, (err, encryptedKeys) => {
      // Handle errors
      if (err) return cb(err)

      // Update addresses
      this.addresses = [...this.addresses, address]

      // Update encrypted keys
      this.encryptedKeys = encryptedKeys as string

      // Log and update signer
      log.info('Private key added to signer', this.id)
      this.update()

      // If signer was unlock -> update keys in worker
      this.unlock(password, cb)
    })
  }

  removePrivateKey(index: number, password: string, cb: ErrorOnlyCallback) {
    // Call worker
    const params = { encryptedKeys: this.encryptedKeys, index, password }
    this.callWorker({ method: 'removeKey', params }, (err, encryptedKeys) => {
      // Handle errors
      if (err) return cb(err)

      // Remove address at index
      this.addresses = this.addresses.filter((address) => address !== this.addresses[index])

      // Update encrypted keys
      this.encryptedKeys = encryptedKeys as string

      // Log and update signer
      log.info('Private key removed from signer', this.id)
      this.update()

      // If signer was unlock -> update keys in worker
      if (this.status === 'ok') this.lock(cb)
      else cb(null)
    })
  }

  // TODO: Encrypt all keys together so that they all get the same password
  async addKeystore(keystore: any, keystorePassword: string, password: string, cb: ErrorOnlyCallback) {
    let wallet
    // Try to generate wallet from keystore
    try {
      if (keystore.version === 1) wallet = await Wallet.fromV1(keystore, keystorePassword)
      else if (keystore.version === 3) wallet = await Wallet.fromV3(keystore, keystorePassword)
      else return cb(new Error('Invalid keystore version'))
    } catch (e) {
      return cb(e as Error)
    }

    // Add private key
    this.addPrivateKey(wallet.getPrivateKey().toString('hex'), password, cb)
  }
}
