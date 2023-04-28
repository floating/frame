import { promisify } from 'util'

import store from '../../../../../main/store'
import RingSigner from '../../../../../main/signers/hot/RingSigner'
import createMockWorker from '../mockWorker'

jest.mock('../../../../../main/store', () => ({}))
jest.mock('child_process', () => ({ fork: () => mockWorker }))
jest.mock('fs')

const token = 'foo'

let signer, mockWorker

beforeEach((done) => {
  mockWorker = createMockWorker()

  store.removeSigner = jest.fn()
  store.updateSigner = jest.fn()
  store.notify = jest.fn()

  signer = new RingSigner()
  signer.once('ready', done)

  mockWorker.emit('message', { type: 'token', token })
})

it('unlocks the signer with the encrypted keys', async () => {
  await addKeyToSigner(signer, {
    privateKey: '4ad2e370dffde680ebfbbbd3db7c33a1d33e4f92a6dda4ffaba0dd134667c061',
    password: 'somepasswordABC',
    encryptedResult:
      '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28'
  })

  const lock = promisify(signer.lock.bind(signer))
  await lock()

  const unlock = promisify(signer.unlock.bind(signer))
  await unlock('somepasswordABC')

  expect(mockWorker.send).toHaveBeenCalledWith({
    id: expect.any(String),
    token,
    method: 'unlock',
    params: {
      encryptedSecret:
        '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28',
      password: 'somepasswordABC'
    }
  })
})

it('fails to unlock with the wrong password', async () => {
  mockWorker.addError('unlock', 'invalid password')

  const unlock = promisify(signer.unlock.bind(signer))

  await expect(unlock('somepassword')).rejects.toThrowError('invalid password')

  expect(mockWorker.send).toHaveBeenCalledWith({
    id: expect.any(String),
    token,
    method: 'unlock',
    params: {
      encryptedSecret: '',
      password: 'somepassword'
    }
  })
})

it('adds private keys to a signer', async () => {
  const expectedSigner = {
    type: 'ring',
    id: '6433613332303530303932636265656132653963333139316136633939343935',
    addresses: ['0x5b921270398ec0032e6eb751d7e83345f3b3b60f', '0xf779148750d7c303034ba54754485e6b1d6aa1b4']
  }

  await addKeyToSigner(signer, {
    privateKey: '4ad2e370dffde680ebfbbbd3db7c33a1d33e4f92a6dda4ffaba0dd134667c061',
    password: 'somepasswordABC',
    encryptedResult:
      '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28'
  })

  await addKeyToSigner(signer, {
    privateKey: 'c3855d679bbe62031d45960595401c6fb48df7177e90012da05b80a843ea65ee',
    password: 'somepasswordXYZ',
    encryptedResult:
      'c4b3a9b3ae5e33d57f4d12d4e8b6290c:4923bd7e36d3461424ce1d26bb22a056:d7237991fc72f4102add666402224cf1e7af824996705e462f5f074efb07ca34e97d0bd465085cf93b31b560ad5a4a0a68c1322b6ed06359b95ac4d5dd04136609b2f6265d365f44e66919e05e4a4fe2'
  })

  expect(store.updateSigner).toHaveBeenNthCalledWith(
    4,
    expect.objectContaining({ ...expectedSigner, status: 'ok' })
  )

  expect(mockWorker.send).toHaveBeenCalledWith({
    id: expect.any(String),
    token,
    method: 'addKey',
    params: {
      key: '4ad2e370dffde680ebfbbbd3db7c33a1d33e4f92a6dda4ffaba0dd134667c061',
      encryptedKeys: '',
      password: 'somepasswordABC'
    }
  })

  expect(mockWorker.send).toHaveBeenCalledWith({
    id: expect.any(String),
    token,
    method: 'addKey',
    params: {
      key: 'c3855d679bbe62031d45960595401c6fb48df7177e90012da05b80a843ea65ee',
      encryptedKeys:
        '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28',
      password: 'somepasswordXYZ'
    }
  })
})

it('removes a private key from a signer', async () => {
  const expectedSigner = {
    type: 'ring',
    id: '3532666466656531623334396235653632363364313063616365303961316265',
    addresses: ['0xf779148750d7c303034ba54754485e6b1d6aa1b4']
  }

  await addKeyToSigner(signer, {
    privateKey: '4ad2e370dffde680ebfbbbd3db7c33a1d33e4f92a6dda4ffaba0dd134667c061',
    password: 'somepasswordABC',
    encryptedResult:
      '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28'
  })

  await addKeyToSigner(signer, {
    privateKey: 'c3855d679bbe62031d45960595401c6fb48df7177e90012da05b80a843ea65ee',
    password: 'somepasswordXYZ',
    encryptedResult:
      'c4b3a9b3ae5e33d57f4d12d4e8b6290c:4923bd7e36d3461424ce1d26bb22a056:d7237991fc72f4102add666402224cf1e7af824996705e462f5f074efb07ca34e97d0bd465085cf93b31b560ad5a4a0a68c1322b6ed06359b95ac4d5dd04136609b2f6265d365f44e66919e05e4a4fe2'
  })

  const removeKey = promisify(signer.removePrivateKey.bind(signer))

  await removeKey(0, 'somepasswordABC')

  expect(store.updateSigner).toHaveBeenNthCalledWith(6, expect.objectContaining(expectedSigner))

  expect(mockWorker.send).toHaveBeenNthCalledWith(5, {
    id: expect.any(String),
    token,
    method: 'removeKey',
    params: {
      index: 0,
      encryptedKeys:
        'c4b3a9b3ae5e33d57f4d12d4e8b6290c:4923bd7e36d3461424ce1d26bb22a056:d7237991fc72f4102add666402224cf1e7af824996705e462f5f074efb07ca34e97d0bd465085cf93b31b560ad5a4a0a68c1322b6ed06359b95ac4d5dd04136609b2f6265d365f44e66919e05e4a4fe2',
      password: 'somepasswordABC'
    }
  })
})

it('adds keys from a keystore to a signer', async () => {
  const keystore = {
    address: '0xcddfa1bd81f56f4d91eec4f7937714823f51f717',
    crypto: {
      kdf: 'pbkdf2',
      kdfparams: {
        c: 262144,
        dklen: 32,
        prf: 'hmac-sha256',
        salt: '4200af415cc4c49a6cccdc4aa81512a3975559b060b491e73d56deb6997c9f1d'
      },
      cipher: 'aes-128-ctr',
      ciphertext: '174ebbe6dd7d64aa8e35c0aced2d65d6cc3775add4a1dc922693ce7cbec08e52',
      cipherparams: {
        iv: '42fbc03759f66c2aa4814711b17022a0'
      },
      mac: 'cfdc8392afbf35c62381d749f9f75ec9d15e30ba84e59368a84dc5a43927804e'
    },
    id: 'adf124f5-0044-4078-8cef-abd7a0065d32',
    version: 3
  }

  const expectedSigner = {
    type: 'ring',
    id: '6339353736343339326631303361303437393639653130663561373235663730',
    addresses: ['0xcddfa1bd81f56f4d91eec4f7937714823f51f717']
  }

  mockWorker.addResult(
    'addKey',
    'a292853a59c3b905d1e8540222fcaaa4:d83d070584e0cdb8a53f5ba3ed14f1d2:b8147cae307d4d477004833f0aed512c0850f2f4cbbe3dc33e1927624a87983a81ebf251713e87d396d77e42362908291c1615b2d53161f6ae17759e5ece1fa409adcad0ebf08b739f149e6b394605df'
  )

  const addKeystore = promisify(signer.addKeystore.bind(signer))

  await addKeystore(keystore, 'test', 'somepassword')

  expect(store.updateSigner).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ ...expectedSigner, status: 'ok' })
  )

  expect(mockWorker.send).toHaveBeenCalledWith({
    id: expect.any(String),
    token,
    method: 'addKey',
    params: {
      key: '8a04e75a02d713fbb71ff106b30fbf58429f201a9dcaf93bed02366916c96fd9',
      encryptedKeys: '',
      password: 'somepassword'
    }
  })
})

// helper methods

async function addKeyToSigner(signer, { privateKey, password, encryptedResult }) {
  mockWorker.addResult('addKey', encryptedResult)

  const addKey = promisify(signer.addPrivateKey.bind(signer))

  return addKey(privateKey, password)
}
