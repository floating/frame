import { promisify } from 'util'

import store from '../../../../../main/store'
import HotSigner from '../../../../../main/signers/hot/HotSigner'
import createMockWorker from '../mockWorker'

const token = 'foo'
let mockWorker

jest.mock('../../../../../main/store', () => ({}))
jest.mock('child_process', () => ({ fork: () => mockWorker }))
jest.mock('fs')

beforeEach(() => {
  mockWorker = createMockWorker()

  store.removeSigner = jest.fn()
  store.updateSigner = jest.fn()
  store.notify = jest.fn()
})

it('receives a token from the worker on instantiation', (done) => {
  const signer = new HotSigner()

  signer.once('ready', () => {
    expect(signer.ready).toBe(true)
    expect(signer.token).toBe(token)
    done()
  })

  mockWorker.emit('message', { type: 'token', token })
})

describe('signer methods', () => {
  let signer

  beforeEach((done) => {
    signer = new HotSigner()

    // need to set a type to allow for updating in the store
    signer.type = 'ring'
    signer.once('ready', done)

    mockWorker.emit('message', { type: 'token', token })
  })

  it('locks the signer', async () => {
    const unlock = promisify(signer.unlock.bind(signer))
    await unlock('somepassword')

    expect(signer.status).toBe('ok')

    const lock = promisify(signer.lock.bind(signer))
    await lock()

    expect(signer.status).toBe('locked')
  })

  it('signs a message', async () => {
    const message = '0x' + Buffer.from('test').toString('hex')
    const expectedSignature =
      'd77422167a5d8f26d3448964c9548d3587ae03f7f7109bd72bd8c317bf8425349bef11475caa37eb7a3b6c5edffdf5ae59fd6aa224c428208fb21b16fc861a184d64'

    mockWorker.addResult('signMessage', expectedSignature)

    const sign = promisify(signer.signMessage.bind(signer))
    const result = await sign(0, message)

    expect(result).toBe(expectedSignature)
    expect(mockWorker.send).toHaveBeenCalledWith({
      id: expect.any(String),
      token,
      method: 'signMessage',
      params: {
        index: 0,
        message
      }
    })
  })

  it('fails to sign a message', async () => {
    const message = '0x' + Buffer.from('test').toString('hex')

    mockWorker.addError('signMessage', 'Signer locked')

    const sign = promisify(signer.signMessage.bind(signer))
    return expect(sign(0, message)).rejects.toThrowError('Signer locked')
  })

  it('signs a transaction', async () => {
    const tx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x0',
      chainId: '0x1'
    }

    const expectedSignature =
      '0xd77422167a5d8f26d3448964c9548d3587ae03f7f7109bd72bd8c317bf8425349bef11475caa37eb7a3b6c5edffdf5ae59fd6aa224c428208fb21b16fc861a184d64'

    mockWorker.addResult('signTransaction', expectedSignature)

    const sign = promisify(signer.signTransaction.bind(signer))
    const result = await sign(0, tx)

    expect(result).toBe(expectedSignature)
    expect(mockWorker.send).toHaveBeenCalledWith({
      id: expect.any(String),
      token,
      method: 'signTransaction',
      params: {
        index: 0,
        rawTx: tx
      }
    })
  })

  it('fails to sign a transaction', async () => {
    const tx = {
      nonce: '0x6',
      gasPrice: '0x09184e72a000',
      gasLimit: '0x30000',
      to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
      value: '0x0',
      chainId: '0x1'
    }

    mockWorker.addError('signTransaction', 'Signer locked')

    const sign = promisify(signer.signTransaction.bind(signer))
    return expect(sign(0, tx)).rejects.toThrowError('Signer locked')
  })

  it('verifies an address', async () => {
    const address = '0xf779148750d7c303034ba54754485e6b1d6aa1b4'

    mockWorker.addResult('verifyAddress', true)

    const verify = promisify(signer.verifyAddress.bind(signer))
    const result = await verify(0, address, 'displayName')

    expect(result).toBe(true)
    expect(mockWorker.send).toHaveBeenCalledWith({
      id: expect.any(String),
      token,
      method: 'verifyAddress',
      params: {
        index: 0,
        address
      }
    })
  })

  it('is unable to verify an address', async () => {
    const address = '0xf779148750d7c303034ba54754485e6b1d6aa1b4'

    mockWorker.addResult('verifyAddress', false)

    const verify = promisify(signer.verifyAddress.bind(signer))

    try {
      await verify(0, address, 'displayName')
      throw new Error('Should not be able to verify address!')
    } catch (e) {
      expect(e.message).toBe('Unable to verify address')
      expect(store.notify).toHaveBeenCalledWith('hotSignerMismatch')
    }
  })

  it('removes the signer on close', () => {
    signer.close()

    expect(mockWorker.disconnect).toHaveBeenCalled()
    expect(store.removeSigner).toHaveBeenCalledWith(signer.id)
  })
})
