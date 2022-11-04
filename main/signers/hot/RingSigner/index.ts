import path from 'path'
import log from 'electron-log'
import Wallet from 'ethereumjs-wallet'
import { HotSigner, SignerData, StoredSigner } from '../HotSigner'
import { PseudoCallback } from '../HotSigner/worker'

const { fromPrivateKey, fromV1, fromV3 } = Wallet
const WORKER_PATH = path.resolve(__dirname, 'worker.js')

interface V1Keystore {
  Address: string;
  Crypto: {
      CipherText: string;
      IV: string;
      KeyHeader: {
          Kdf: string;
          KdfParams: {
              DkLen: number;
              N: number;
              P: number;
              R: number;
              SaltLen: number;
          };
          Version: string;
      };
      MAC: string;
      Salt: string;
  };
  Id: string;
  Version: string;
}
interface ScryptKDFParamsOut {
  dklen: number;
  n: number;
  p: number;
  r: number;
  salt: string;
}
interface PBKDFParamsOut {
  c: number;
  dklen: number;
  prf: string;
  salt: string;
}
type KDFParamsOut = ScryptKDFParamsOut | PBKDFParamsOut;
interface V3Keystore {
  crypto: {
      cipher: string;
      cipherparams: {
          iv: string;
      };
      ciphertext: string;
      kdf: string;
      kdfparams: KDFParamsOut;
      mac: string;
  };
  id: string;
  version: number;
}

export class RingSigner extends HotSigner {
  protected encryptedKeys: string[]
  public type = 'ring'
  public model = 'keyring'

  constructor (signer: StoredSigner) {
    super(signer, WORKER_PATH)
    this.encryptedKeys = (signer && signer.encryptedKeys)
    if (this.encryptedKeys) this.update()
  }

  save () {
    super.save({ encryptedKeys: this.encryptedKeys })
  }

  unlock (password: Buffer, _data: SignerData, cb: PseudoCallback) {
    super.unlock(password, { encryptedKeys: this.encryptedKeys }, cb)
  }

  addPrivateKey (key: string, password: Buffer, cb: PseudoCallback) {
    // Validate private key
    let wallet
    try {
      wallet = fromPrivateKey(Buffer.from(key, 'hex'))
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
    this.callWorker({ method: 'addKey', params }, (err: Error | null, encryptedKeys: string[]) => {
      // Handle errors
      if (err) return cb(err)

      // Update addresses
      this.addresses = [...this.addresses, address]

      // Update encrypted keys
      this.encryptedKeys = encryptedKeys

      // Log and update signer
      log.info('Private key added to signer', this.id)
      this.update()

      // If signer was unlock -> update keys in worker
      if (this.status === 'ok') this.unlock(password, {}, cb)
      else cb()
    })
  }

  removePrivateKey (index: number, password: Buffer, cb: PseudoCallback) {
    // Call worker
    const params = { encryptedKeys: this.encryptedKeys, index, password }
    this.callWorker({ method: 'removeKey', params }, (err: Error | null, encryptedKeys: string[]) => {
      // Handle errors
      if (err) return cb(err)

      // Remove address at index
      this.addresses = this.addresses.filter((address: string) => address !== this.addresses[index])

      // Update encrypted keys
      this.encryptedKeys = encryptedKeys

      // Log and update signer
      log.info('Private key removed from signer', this.id)
      this.update()

      // If signer was unlock -> update keys in worker
      if (this.status === 'ok') this.unlock(password, {}, cb)
      else cb()
    })
  }

  // TODO: Encrypt all keys together so that they all get the same password
  async addKeystore (keystore: V3Keystore | V1Keystore, keystorePassword: string, password: Buffer, cb: PseudoCallback) {
    let wallet
    // Try to generate wallet from keystore
    try {
      if ((keystore as V3Keystore).version === 3) wallet = await fromV3(keystore as V3Keystore, keystorePassword)
      else if ((keystore as V1Keystore).Version === '1') wallet = await fromV1(keystore as V1Keystore, keystorePassword)
      else return cb(new Error('Invalid keystore version'))
    } catch (e) { return cb(e as Error) }
    // Add private key
    this.addPrivateKey(wallet.getPrivateKey().toString('hex'), password, cb)
  }
}

