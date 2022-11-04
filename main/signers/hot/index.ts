import path from 'path'
import fs from 'fs'
import { ensureDirSync } from 'fs-extra'
import { app } from 'electron'
import log from 'electron-log'
import bip39 from 'bip39'
import zxcvbn from 'zxcvbn'
import { stripHexPrefix } from 'ethereumjs-util'

import crypt from '../../crypt'

import { SeedSigner } from './SeedSigner'
import { RingSigner } from './RingSigner'
import { StoredSigner } from './HotSigner'
import { Keystore, Signers } from '..'

const USER_DATA = app ? app.getPath('userData') : path.resolve(path.dirname(require.main ? require.main.filename : ''), '../.userData');
const SIGNERS_PATH = path.resolve(USER_DATA, 'signers')

const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export = {
  newPhrase: (cb: Callback<string>) => {
    cb(null, bip39.generateMnemonic())
  },
  createFromSeed: (signers: Signers, seed: string, password: string, cb: Callback<SeedSigner>) => {
    if (!seed) return cb(new Error('Seed required to create hot signer'))
    if (!password) return cb(new Error('Password required to create hot signer'))
    if (password.length < 12) return cb(new Error('Hot account password is too short'))
    if (zxcvbn(password).score < 3) return cb(new Error('Hot account password is too weak'))
    const signer = new SeedSigner()
    signer.addSeed(seed, password, (err, result) => {
      if (err) {
        signer.close()
        return cb(err)
      }
      signers.add(signer)
      cb(null, signer)
    })
  },
  createFromPhrase: (signers: Signers, phrase: string, password: string, cb: Callback<SeedSigner>) => {
    if (!phrase) return cb(new Error('Phrase required to create hot signer'))
    if (!password) return cb(new Error('Password required to create hot signer'))
    if (password.length < 12) return cb(new Error('Hot account password is too short'))
    if (zxcvbn(password).score < 3) return cb(new Error('Hot account password is too weak'))
    const signer = new SeedSigner()
    signer.addPhrase(phrase, password, err => {
      if (err) {
        signer.close()
        return cb(err)
      }
      signers.add(signer)
      cb(null, signer)
    })
  },
  createFromPrivateKey: (signers: Signers, privateKey: string, password: string, cb: Callback<RingSigner>) => {
    const privateKeyHex = stripHexPrefix(privateKey)

    if (!privateKeyHex) return cb(new Error('Private key required to create hot signer'))
    if (!password) return cb(new Error('Password required to create hot signer'))
    if (password.length < 12) return cb(new Error('Hot account password is too short'))
    if (zxcvbn(password).score < 3) return cb(new Error('Hot account password is too weak'))
    const signer = new RingSigner()

    signer.addPrivateKey(privateKeyHex, password, err => {
      if (err) {
        signer.close()
        return cb(err)
      }
      signers.add(signer)
      cb(null, signer)
    })
  },
  createFromKeystore: (signers: Signers, keystore: Keystore, keystorePassword: string, password: string, cb: Callback<RingSigner>) => {
    if (!keystore) return cb(new Error('Keystore required'))
    if (!keystorePassword) return cb(new Error('Keystore password required'))
    if (!password) return cb(new Error('Password required to create hot signer'))
    if (password.length < 12) return cb(new Error('Hot account password is too short'))
    if (zxcvbn(password).score < 3) return cb(new Error('Hot account password is too weak'))
    const signer = new RingSigner()
    signer.addKeystore(keystore, keystorePassword, password, err => {
      if (err) {
        signer.close()
        return cb(err)
      }
      signers.add(signer)
      cb(null, signer)
    })
  },
  scan: (signers: Signers) => {
    const storedSigners: Record<string, StoredSigner> = {}

    const scan = async () => {
      // Ensure signer directory exists
      ensureDirSync(SIGNERS_PATH)

      // Find stored signers, read them from disk and add them to storedSigners
      fs.readdirSync(SIGNERS_PATH).forEach((file) => {
        try {
          const signer: StoredSigner = JSON.parse(fs.readFileSync(path.resolve(SIGNERS_PATH, file), 'utf8'))
          storedSigners[signer.id] = signer
        } catch (e) { log.error(`Corrupt signer file: ${file}`) }
      })

      // Add stored signers
      for (const id of Object.keys(storedSigners)) {
        await wait(100)
        const { addresses, encryptedKeys, encryptedSeed, type, network } = storedSigners[id]
        if (addresses && addresses.length) {
          const id = crypt.stringToKey(addresses.join()).toString('hex')
          if (!signers.exists(id)) {
            if (type === 'seed') {
              signers.add(new SeedSigner({ id, network, addresses, encryptedSeed, type }))
            } else if (type === 'ring') {
              signers.add(new RingSigner({ id, network, addresses, encryptedKeys, type }))
            }
          }
        }
      }
    }

    // Delay creating child process until after initial load
    setTimeout(scan, 4000)

    return scan
  }
}
