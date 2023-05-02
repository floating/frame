import path from 'path'
import fs from 'fs'
import zxcvbn from 'zxcvbn'
import log from 'electron-log'
import { generateMnemonic } from 'bip39'
import { ensureDirSync } from 'fs-extra'
import { app } from 'electron'
import { stripHexPrefix } from '@ethereumjs/util'

import { stringToKey } from '../../crypt'
import { wait } from '../../../resources/utils'

import SeedSigner, { SeedSignerData } from './SeedSigner'
import RingSigner, { RingSignerData } from './RingSigner'

import type { Signers } from '..'
import type Signer from '../Signer'
import type { HotSignerType } from '../../store/state'

export interface HotSignerData {
  type: HotSignerType
  addresses: Address[]
}

const SIGNERS_PATH = path.resolve(app.getPath('userData'), 'signers')

export default {
  newPhrase: (cb: Callback<string>) => {
    cb(null, generateMnemonic())
  },
  createFromPhrase: (signers: Signers, phrase: string, password: string, cb: Callback<Signer>) => {
    if (!phrase) return cb(new Error('Phrase required to create hot signer'))
    if (!password) return cb(new Error('Password required to create hot signer'))
    if (password.length < 12) return cb(new Error('Hot account password is too short'))
    if (zxcvbn(password).score < 3) return cb(new Error('Hot account password is too weak'))

    const signer = new SeedSigner()

    signer.once('ready', () => {
      signer.addPhrase(phrase, password, (err) => {
        if (err) {
          signer.close()
          return cb(err)
        }
        signers.add(signer)
        cb(null, signer)
      })
    })
  },
  createFromPrivateKey: (signers: Signers, privateKey: string, password: string, cb: Callback<Signer>) => {
    const privateKeyHex = stripHexPrefix(privateKey)

    if (!privateKeyHex) return cb(new Error('Private key required to create hot signer'))
    if (!password) return cb(new Error('Password required to create hot signer'))
    if (password.length < 12) return cb(new Error('Hot account password is too short'))
    if (zxcvbn(password).score < 3) return cb(new Error('Hot account password is too weak'))

    const signer = new RingSigner()

    signer.once('ready', () => {
      signer.addPrivateKey(privateKeyHex, password, (err) => {
        if (err) {
          signer.close()
          return cb(err)
        }
        signers.add(signer)
        cb(null, signer)
      })
    })
  },
  createFromKeystore: (
    signers: Signers,
    keystore: any,
    keystorePassword: string,
    password: string,
    cb: Callback<Signer>
  ) => {
    if (!keystore) return cb(new Error('Keystore required'))
    if (!keystorePassword) return cb(new Error('Keystore password required'))
    if (!password) return cb(new Error('Password required to create hot signer'))
    if (password.length < 12) return cb(new Error('Hot account password is too short'))
    if (zxcvbn(password).score < 3) return cb(new Error('Hot account password is too weak'))
    const signer = new RingSigner()

    signer.once('ready', () => {
      signer.addKeystore(keystore, keystorePassword, password, (err) => {
        if (err) {
          signer.close()
          return cb(err)
        }
        signers.add(signer)
        cb(null, signer)
      })
    })
  },
  scan: (signers: Signers) => {
    const storedSigners: Record<string, HotSignerData> = {}

    const scan = async () => {
      // Ensure signer directory exists
      ensureDirSync(SIGNERS_PATH)

      // Find stored signers, read them from disk and add them to storedSigners
      fs.readdirSync(SIGNERS_PATH).forEach((file) => {
        try {
          const signer = JSON.parse(fs.readFileSync(path.resolve(SIGNERS_PATH, file), 'utf8'))
          storedSigners[signer.id] = signer
        } catch (e) {
          log.error(`Corrupt signer file: ${file}`)
        }
      })

      // Add stored signers
      for (const id of Object.keys(storedSigners)) {
        await wait(100)
        const signerData = storedSigners[id]
        const { addresses, type } = signerData

        if (addresses && addresses.length) {
          const id = stringToKey(addresses.join()).toString('hex')
          if (!signers.exists(id)) {
            if (type === 'seed') {
              const { encryptedSeed } = signerData as SeedSignerData
              const signer = SeedSigner.fromStoredData({ addresses, encryptedSeed })
              signers.add(signer)
            } else if (type === 'ring') {
              const { encryptedKeys } = signerData as RingSignerData
              const signer = RingSigner.fromStoredData({ addresses, encryptedKeys })

              signers.add(signer)
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
