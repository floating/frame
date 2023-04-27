import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { ensureDirSync, remove } from 'fs-extra'
import { _forkedChildProcess as workerProcess } from 'child_process'

import store from '../../../../main/store'
import hot from '../../../../main/signers/hot'
import WorkerController from '../../../../main/signers/hot/HotSigner/worker/controller'
import RingSignerWorker from '../../../../main/signers/hot/RingSigner/worker'
import SeedSignerWorker from '../../../../main/signers/hot/SeedSigner/worker'
import { assertDone } from '../../../util'

jest.mock('../../../../main/store', () => ({ updateSigner: jest.fn(), removeSigner: jest.fn() }))
jest.mock('child_process')
jest.mock('crypto')

const PASSWORD = 'fr@///3_password'
const SIGNER_PATH = path.resolve(app.getPath('userData'), 'signers')
const FILE_PATH = path.resolve(__dirname, 'keystore.json')

const signers = { add: jest.fn(), exists: jest.fn(() => false) }

let worker

const ipc = {
  send: (msg) => workerProcess.send(msg),
  on: (msg, cb) => workerProcess.on(msg, cb)
}

// simulate worker process being spawned
const startWorkerProcess = () => jest.runOnlyPendingTimers()

const launchWorkerProcess = () => {
  setTimeout(() => {
    new WorkerController(worker, ipc)
  }, 0)
}

beforeEach(async () => {
  await remove(SIGNER_PATH)

  // this event is emitted when fork() is called in the mock child process library.
  // this will simulate the worker process being started asynchonously, on the
  // next tick of the event loop
  workerProcess.once('start', launchWorkerProcess)

  signers.add = jest.fn()
  store.updateSigner = jest.fn()
})

describe('Ring signers', () => {
  const privateKey = '0x372f581b45880333b318a19d5bfd1e4ab680bdafbfbece0216876b7a94ef16ae'

  const privateKeySigner = {
    type: 'ring',
    model: 'keyring',
    id: '3661326338643332343336613133363039376137346262663331373663666430',
    addresses: ['0x249254933970e4ec336ea717fb9dc32d85dfa621'],
    appVersion: { major: 0, minor: 0, patch: 0 }
  }

  beforeEach(() => {
    worker = new RingSignerWorker()
  })

  it('creates a signer from a private key', (done) => {
    hot.createFromPrivateKey(signers, privateKey, PASSWORD, (err, signer) => {
      assertDone(() => {
        expect(err).toBe(null)

        // verify signer
        const { id, type, model, addresses, appVersion } = signer
        expect({ id, type, model, addresses, appVersion }).toStrictEqual(privateKeySigner)

        // verify signer has been added to signers map
        expect(signers.add).toHaveBeenCalledWith(expect.objectContaining(privateKeySigner))

        // verify store has been updated correctly with unlocked signer
        expect(store.updateSigner).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ ...privateKeySigner, status: 'locked' })
        )
        expect(store.updateSigner).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ ...privateKeySigner, status: 'ok' })
        )

        // ensure signer is written to disk
        const persistedSigner = JSON.parse(fs.readFileSync(path.resolve(SIGNER_PATH, `${id}.json`), 'utf8'))
        expect(persistedSigner).toEqual(
          expect.objectContaining({
            id,
            type,
            addresses,
            encryptedKeys:
              '01010101010101010101010101010101:01010101010101010101010101010101:636c77a8bbd3aa295be522781a1ef28b8f9bfb3cf80152b673f80a9960bed4fb48f335be978072886fed415ef13f3786449e88c8236444a547d16727664c59361c58c4b92c14a04cbe3ee7c80322aef6'
          })
        )

        signer.close()
      }, done)
    })

    startWorkerProcess()
  }, 500)

  it('should not create a signer from an invalid private key', (done) => {
    const invalidPrivateKey = 'invalid key'

    hot.createFromPrivateKey(signers, invalidPrivateKey, PASSWORD, (err) => {
      assertDone(() => {
        expect(err.message).toBe('Invalid private key')
        expect(signers.add).not.toHaveBeenCalled()
        expect(store.updateSigner).not.toHaveBeenCalled()
      }, done)
    })

    startWorkerProcess()
  })

  it('creates a signer from a keystore', (done) => {
    const keystoreSigner = {
      type: 'ring',
      model: 'keyring',
      id: '6339353736343339326631303361303437393639653130663561373235663730',
      addresses: ['0xcddfa1bd81f56f4d91eec4f7937714823f51f717'],
      appVersion: { major: 0, minor: 0, patch: 0 }
    }

    const file = fs.readFileSync(FILE_PATH, 'utf8')
    const keystore = JSON.parse(file)

    hot.createFromKeystore(signers, keystore, 'test', PASSWORD, (err, signer) => {
      assertDone(() => {
        expect(err).toBe(null)

        // verify signer
        const { id, type, model, addresses, appVersion } = signer
        expect({ id, type, model, addresses, appVersion }).toStrictEqual(keystoreSigner)

        // verify signer has been added to signers map
        expect(signers.add).toHaveBeenCalledWith(expect.objectContaining(keystoreSigner))

        // verify store has been updated correctly with unlocked signer
        expect(store.updateSigner).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ ...keystoreSigner, status: 'locked' })
        )
        expect(store.updateSigner).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ ...keystoreSigner, status: 'ok' })
        )

        // ensure signer is written to disk
        const persistedSigner = JSON.parse(fs.readFileSync(path.resolve(SIGNER_PATH, `${id}.json`), 'utf8'))
        expect(persistedSigner).toEqual(
          expect.objectContaining({
            id,
            type,
            addresses,
            encryptedKeys:
              '01010101010101010101010101010101:01010101010101010101010101010101:24c6b507ea0741763fd81920018dd7a6c65292b8f36957eab47abab0be581ee68890ecded0ad941c0a781f4153cfb0d241529d4075f00776967fbe8c5dfadbc548fbce7877cc5f93bd61d1c5df05ff68'
          })
        )

        signer.close()
      }, done)
    })

    startWorkerProcess()
  }, 500)

  it('should not create a signer from an invalid keystore', (done) => {
    const keystore = { invalid: 'keystore' }

    hot.createFromKeystore(signers, keystore, 'test', PASSWORD, (err) => {
      assertDone(() => {
        expect(err.message).toBe('Invalid keystore version')
        expect(signers.add).not.toHaveBeenCalled()
        expect(store.updateSigner).not.toHaveBeenCalled()
      }, done)
    })

    startWorkerProcess()
  })

  it('scans for ring signers', async () => {
    // this test uses the encrypted json output from the "create signer from private key" test above
    const createdSigner = await scanForSignersOnDisk('privateKeySigner', privateKeySigner.id)

    expect(createdSigner).toEqual(expect.objectContaining(privateKeySigner))
  })
})

describe('Seed signers', () => {
  const mnemonic = 'truly wish balcony wall swing false radar announce shrug cactus mercy carpet'

  const mnemonicSigner = {
    id: '3361626661643862386263326538633230636561303030393064343262356639',
    type: 'seed',
    model: 'phrase',
    appVersion: { major: 0, minor: 0, patch: 0 }
  }

  beforeEach(() => {
    worker = new SeedSignerWorker()
  })

  it('creates a signer from a mnemonic phrase', (done) => {
    hot.createFromPhrase(signers, mnemonic, PASSWORD, (err, signer) => {
      assertDone(() => {
        expect(err).toBe(null)

        // verify signer
        const { id, type, model, appVersion } = signer
        expect({ id, type, model, appVersion }).toStrictEqual(mnemonicSigner)
        expect(signer.addresses.length).toBe(100)

        // verify signer has been added to signers map
        expect(signers.add).toHaveBeenCalledWith(expect.objectContaining(mnemonicSigner))

        // verify store has been updated correctly with unlocked signer
        expect(store.updateSigner).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ ...mnemonicSigner, status: 'locked' })
        )
        expect(store.updateSigner).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ ...mnemonicSigner, status: 'ok' })
        )

        // ensure signer is written to disk
        const persistedSigner = JSON.parse(fs.readFileSync(path.resolve(SIGNER_PATH, `${id}.json`), 'utf8'))
        expect(persistedSigner).toEqual(
          expect.objectContaining({
            id,
            type,
            addresses: expect.any(Array),
            encryptedSeed:
              '01010101010101010101010101010101:01010101010101010101010101010101:4701a2d5e8aac93a0b727758797f4999687187e83286e417e0a7e3f715ea03ba5e60810cff2b8203103f23b1f4fbe1a0bb6d0f46ef8011e9acfbbd24c3dc0d4403d83772570a0850b521b252871e57c064216e28b350fb5ad2eba83b11494c89940846312cd9e4d825db3674536398d255811384ba3c5a39ec96a3ce1183085cb1fbd8289d7f2bf30c7ef1a37680dc44'
          })
        )
      }, done)
    })

    startWorkerProcess()
  }, 4000)

  it('does not create a signer from an invalid mnemonic phrase', (done) => {
    const mnemonic = 'invalid mnemonic'

    hot.createFromPhrase(signers, mnemonic, PASSWORD, (err) => {
      assertDone(() => {
        expect(err.message).toBe('Invalid mnemonic phrase')
        expect(signers.add).not.toHaveBeenCalled()
        expect(store.updateSigner).not.toHaveBeenCalled()
      }, done)
    })

    startWorkerProcess()
  })

  it('scans for seed signers', async () => {
    // this test uses the encrypted json output from the "create signer from mnemonic phrase" test above
    const createdSigner = await scanForSignersOnDisk('mnemonicSigner', mnemonicSigner.id)

    expect(createdSigner).toEqual(expect.objectContaining(mnemonicSigner))
    expect(createdSigner.addresses).toHaveLength(100)
  })
})

// helper functions

async function scanForSignersOnDisk(signerName, signerId) {
  ensureDirSync(SIGNER_PATH)
  fs.copyFileSync(
    path.resolve(__dirname, `${signerName}.json`),
    path.resolve(SIGNER_PATH, `${signerId}.json`)
  )

  const createdSigner = new Promise((resolve) => signers.add.mockImplementation(resolve))

  hot.scan(signers)

  // initial scan delay
  jest.advanceTimersByTime(4000)

  // wait for loop in scanner
  jest.advanceTimersByTime(100)

  return createdSigner
}
