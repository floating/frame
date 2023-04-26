import EventEmitter from 'events'

import HotSigner from '../../../../../main/signers/hot/HotSigner'

let mockWorker

jest.mock('../../../../../main/store')
jest.mock('child_process', () => ({ fork: () => mockWorker }))

beforeEach(() => {
  mockWorker = new EventEmitter()
})

it('receives a token from the worker on instantiation', (done) => {
  const signer = new HotSigner()

  signer.once('ready', () => {
    expect(signer.ready).toBe(true)
    expect(signer.token).toBe('foo')
    done()
  })

  mockWorker.emit('message', { type: 'token', token: 'foo' })
})
