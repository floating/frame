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
