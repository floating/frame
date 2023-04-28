import EventEmitter from 'events'
import crypto from 'crypto'

import store from '../../../../../main/store'
import RingSigner from '../../../../../main/signers/hot/RingSigner'

let mockWorker

jest.mock('../../../../../main/store', () => ({ updateSigner: jest.fn() }))
jest.mock('child_process', () => ({ fork: () => mockWorker }))
jest.mock('crypto')
jest.mock('fs')

//   test('Add private key', (done) => {
//     try {
//       const privateKey = crypto.randomBytes(32).toString('hex')
//       signer.addPrivateKey(privateKey, PASSWORD, (err) => {
//         expect(err).toBe(null)
//         expect(signer.addresses.length).toBe(2)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 2000)

beforeEach(() => {
  mockWorker = new EventEmitter()
  mockWorker.send = jest.fn()

  store.updateSigner = jest.fn()
})

it('adds a private key', (done) => {
  const signer = new RingSigner()
  const privateKey = crypto.randomBytes(32).toString('hex')
  console.log({ privateKey })

  mockWorker.send.mockImplementation((msg) => {
    console.log({ msg })

    const { id, method } = msg
    if (method == 'addKey') {
      mockWorker.emit('message', {
        type: 'rpc',
        id,
        result:
          '74785d8d06903f0da4a787fb0f5d3885:dee40a11065712764bde11ae92fbba91:3b0ed11edee8bb862ad2381c8b939b2d5cf860ce6ee438b79cf4dd6aceb1c9f0406283e19afa436581c45dc5331056a789164175072dded5ede8ac45181a10b67dc4e4e5673ce10d31559316c2ed689b'
      })
    }

    if (method === 'unlock') {
      mockWorker.emit('message', {
        type: 'rpc',
        id
      })
    }
  })

  signer.once('ready', () => {
    signer.addPrivateKey(privateKey, 'somepassword', (err) => {
      console.log({ err })
      expect(store.updateSigner).toHaveBeenCalledWith({})
      done()
    })
  })

  mockWorker.emit('message', { type: 'token', token: 'foo' })
})

// import hot from '../../../../../main/signers/hot'

// const PASSWORD = 'fr@///3_password'
// const SIGNER_PATH = path.resolve(__dirname, '../.userData/signers')
// const FILE_PATH = path.resolve(__dirname, 'keystore.json')

// jest.mock('path', () => {
//   const original = jest.requireActual('path')

//   return {
//     ...original,
//     resolve: (...args) => {
//       // TODO: this can be cleaned up once tests are re-worked
//       if (args.includes('worker/launch.js')) {
//         return original.resolve(
//           __dirname,
//           '../../../../../compiled/main/signers/hot/HotSigner/worker/launch.js'
//         )
//       }

//       return original.resolve(...args)
//     }
//   }
// })

// jest.mock('electron')
// jest.mock('../../../../../main/store/persist')

// // Stubs
// const signers = { add: () => {} }
// // Util
// const clean = () => remove(SIGNER_PATH)

// let store

// describe('Ring signer', () => {
//   let signer

//   beforeAll(async () => {
//     log.transports.console.level = false

//     clean()

//     store = require('../../../../../main/store').default
//   })

//   afterEach(() => {
//     jest.useRealTimers()
//   })

//   afterAll(() => {
//     clean()
//     if (signer.status !== 'locked') {
//       signer.close()
//     }
//     log.transports.console.level = 'debug'
//   })

//   test('Close signer', (done) => {
//     try {
//       signer.close()
//       expect(store(`main.signers.${signer.id}`)).toBe(undefined)
//       done()
//     } catch (e) {
//       done(e)
//     }
//   })

//   test('Remove private key', (done) => {
//     try {
//       const secondAddress = signer.addresses[1]
//       signer.removePrivateKey(0, PASSWORD, (err) => {
//         expect(err).toBe(null)
//         expect(signer.addresses.length).toBe(1)
//         expect(signer.addresses[0]).toEqual(secondAddress)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 2000)

//   test('Remove last private key', (done) => {
//     try {
//       signer.removePrivateKey(0, PASSWORD, (err) => {
//         expect(err).toBe(null)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 2000)

//   test('Add private key from keystore', (done) => {
//     try {
//       const file = fs.readFileSync(FILE_PATH, 'utf8')
//       const keystore = JSON.parse(file)
//       const previousLength = signer.addresses.length

//       signer.addKeystore(keystore, 'test', PASSWORD, (err) => {
//         expect(err).toBe(null)
//         expect(signer.addresses.length).toBe(previousLength + 1)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 2000)

//   test('Lock', (done) => {
//     try {
//       signer.lock((err) => {
//         expect(err).toBe(null)
//         expect(signer.status).toBe('locked')
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 2000)

//   test('Unlock with wrong password', (done) => {
//     try {
//       signer.unlock('Wrong password', (err) => {
//         expect(err).toBeTruthy()
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 600)

//   test('Unlock', (done) => {
//     try {
//       signer.unlock(PASSWORD, (err) => {
//         expect(err).toBe(null)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 500)

//   test('Sign message', (done) => {
//     try {
//       const message = '0x' + Buffer.from('test').toString('hex')

//       signer.signMessage(0, message, (err, result) => {
//         expect(err).toBe(null)
//         expect(result.length).toBe(132)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 500)

//   test('Sign transaction', (done) => {
//     const rawTx = {
//       nonce: '0x6',
//       gasPrice: '0x09184e72a000',
//       gasLimit: '0x30000',
//       to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7',
//       value: '0x0',
//       chainId: '0x1'
//     }

//     try {
//       signer.signTransaction(0, rawTx, (err, result) => {
//         expect(err).toBe(null)
//         expect(result.length).not.toBe(0)
//         expect(result.slice(0, 2)).toBe('0x')
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 500)

//   test('Verify address', (done) => {
//     try {
//       signer.verifyAddress(0, signer.addresses[0], false, (err, result) => {
//         expect(err).toBe(null)
//         expect(result).toBe(true)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 500)

//   test('Verify wrong address', (done) => {
//     try {
//       signer.verifyAddress(0, '0xabcdef', false, (err, result) => {
//         expect(err.message).toBe('Unable to verify address')
//         expect(result).toBe(undefined)
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   }, 500)

//   test('Sign message when locked', (done) => {
//     try {
//       signer.signMessage(0, 'test', (err) => {
//         expect(err.message).toBe('Signer locked')
//         done()
//       })
//     } catch (e) {
//       done(e)
//     }
//   })

//   test('Close signer', (done) => {
//     try {
//       signer.close()
//       done()
//     } catch (e) {
//       done(e)
//     }
//   })
// })
