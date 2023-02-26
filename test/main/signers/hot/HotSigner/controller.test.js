import EventEmitter from 'events'
import crypto from 'crypto'

import { HotSignerWorkerController } from '../../../../../main/signers/hot/HotSigner/controller'

let ipc, worker, token

beforeEach(() => {
  ipc = new EventEmitter()
  ipc.send = jest.fn()

  worker = {
    signMessage: jest.fn(),
    handleMessage: jest.fn()
  }

  new HotSignerWorkerController(worker, ipc)

  token = ipc.send.mock.calls[0][0].token
  expect(token).toMatch(/^[A-Za-z0-9]{64}$/)

  ipc.send.mockClear()
})

afterEach(() => {
  ipc.removeAllListeners()
})

it('does not handle a message with an invalid token', () => {
  ipc.emit('message', {
    id: 1,
    method: 'signMessage',
    params: [],
    token: crypto.randomBytes(32).toString('hex')
  })

  expect(ipc.send).toHaveBeenCalledWith({ id: 1, type: 'rpc', error: 'Invalid token', result: undefined })
})

it('verifies an address on the signer worker', () => {
  ipc.emit('message', {
    id: 1,
    method: 'verifyAddress',
    params: { index: 0, address: '' },
    token
  })

  expect(worker.signMessage).toHaveBeenCalledWith(expect.any(Function), {
    index: 0,
    message: expect.stringMatching(/^0x[A-Za-z0-9]{64}$/)
  })
})

it('dispatches a message to the signer worker for handling', () => {
  const tx = { chainId: '0x5', from: 'someone' }

  ipc.emit('message', {
    id: 2,
    method: 'signTransaction',
    params: { index: 5, rawTx: tx },
    token
  })

  expect(worker.handleMessage).toHaveBeenCalledWith(expect.any(Function), 'signTransaction', {
    index: 5,
    rawTx: tx
  })
})

it('returns the result after the signer worker handles a message', () => {
  worker.handleMessage.mockImplementation((cb) => cb(null, 'txsignature'))

  ipc.emit('message', {
    id: 2,
    method: 'signTypedData',
    params: { index: 8, message: 'signme' },
    token
  })

  expect(ipc.send).toHaveBeenCalledWith({ id: 2, type: 'rpc', error: undefined, result: 'txsignature' })
})

it('returns an error after the signer worker cannot handle a message', () => {
  worker.handleMessage.mockImplementation((cb) => cb('Invalid method'))

  ipc.emit('message', {
    id: 2,
    method: 'sendRawTransaction',
    params: { index: 8, message: 'signme' },
    token
  })

  expect(ipc.send).toHaveBeenCalledWith({ id: 2, type: 'rpc', error: 'Invalid method', result: undefined })
})
