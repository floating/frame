import { promisify } from 'util'

import store from '../../../../../main/store'
import SeedSigner from '../../../../../main/signers/hot/SeedSigner'
import createMockWorker from '../mockWorker'

jest.mock('../../../../../main/store', () => ({}))
jest.mock('child_process', () => ({ fork: () => mockWorker }))
jest.mock('ethers', () => ({ utils: { computeAddress: () => '0xtest' } }))
jest.mock('fs')

const token = 'foo'
const mnemonic = 'truly wish balcony wall swing false radar announce shrug cactus mercy carpet'

let signer, mockWorker

beforeEach((done) => {
  mockWorker = createMockWorker()

  store.removeSigner = jest.fn()
  store.updateSigner = jest.fn()
  store.notify = jest.fn()

  signer = new SeedSigner()
  signer.once('ready', done)

  mockWorker.emit('message', { type: 'token', token })
})

it('unlocks the signer with the encrypted keys', async () => {
  mockWorker.addResult(
    'encryptSeed',
    '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28'
  )

  const addPhrase = promisify(signer.addPhrase.bind(signer))
  await addPhrase(mnemonic, 'somepassword198')

  const lock = promisify(signer.lock.bind(signer))
  await lock()

  mockWorker.send.mockClear()

  const unlock = promisify(signer.unlock.bind(signer))
  await unlock('somepassword198')

  expect(mockWorker.send).toHaveBeenCalledWith({
    id: expect.any(String),
    token,
    method: 'unlock',
    params: {
      encryptedSecret:
        '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28',
      password: 'somepassword198'
    }
  })
})

it('adds a mnemonic phrase to a signer', async () => {
  const expectedSigner = {
    model: 'phrase',
    type: 'seed',
    id: '6462633939626236623534646635623134383134376435353235393764326139'
    //addresses: ['0xf779148750d7c303034ba54754485e6b1d6aa1b4']
  }

  mockWorker.addResult(
    'encryptSeed',
    '7f575d51c5f4a1dce66368160a869768:554030e5813b7d9fb8f75e507639c24d:b37f66fd23190e36f10b4e5e621e8a0de80e2c65059c192164c10c7c3a1e52102ad0227a2f74c54b017b676316d0096d4e9ceb55f380da3704c560e7ae32bcdb917069cdb97ef416d3891b85169aca28'
  )

  const addPhrase = promisify(signer.addPhrase.bind(signer))
  await addPhrase(mnemonic, 'somepassword198')

  const lockedSigner = store.updateSigner.mock.calls[0][0]
  const { id, type, model, status, addresses } = lockedSigner
  expect({ id, type, model }).toStrictEqual(expectedSigner)
  expect(status).toBe('locked')
  expect(addresses).toHaveLength(100)

  const unlockedSigner = store.updateSigner.mock.calls[1][0]
  expect(unlockedSigner.status).toBe('ok')
  expect(unlockedSigner.addresses).toHaveLength(100)

  expect(mockWorker.send).toHaveBeenCalledWith({
    id: expect.any(String),
    token,
    method: 'encryptSeed',
    params: {
      seed: 'a21e6860c54f72d9de7362b11e1d06f96c2da1c9a4c6d6943056cc0ca8cf288a0c77e9a3aa47000a995266c261d99c125478b304b66c60066f512c64a3e21228',
      password: 'somepassword198'
    }
  })
}, 200)

it('does not add an invalid mnemonic phrase', async () => {
  const addPhrase = promisify(signer.addPhrase.bind(signer))
  await expect(addPhrase('invalid', 'somepassword198')).rejects.toThrow('Invalid mnemonic')
})

it('does not add a mnemonic phrase to a signer that already has a seed', async () => {
  signer.encryptedSeed = 'test'

  const addPhrase = promisify(signer.addPhrase.bind(signer))
  await expect(addPhrase(mnemonic, 'somepassword198')).rejects.toThrow('This signer already has a seed')
})
