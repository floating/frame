import log from 'electron-log'
import { fromUtf8 } from '@ethereumjs/util'
import { getRawTx, getSignedAddress } from '../../../main/provider/helpers'

jest.mock('../../../main/store')

beforeAll(async () => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

describe('#getRawTx', () => {
  it('leaves a valid value unchanged', () => {
    const tx = getRawTx({ value: '0x2540be400' })

    expect(tx.value).toBe('0x2540be400')
  })

  it('removes a leading zero from a valid value', () => {
    const tx = getRawTx({ value: '0x0a45c6' })

    expect(tx.value).toBe('0xa45c6')
  })

  it('leaves a valid zero value unchanged', () => {
    const tx = getRawTx({ value: '0x0' })

    expect(tx.value).toBe('0x0')
  })

  it('turns a zero value into the correct hex value for zero', () => {
    const tx = getRawTx({ value: '0x' })

    expect(tx.value).toBe('0x0')
  })

  it('turns an un-prefixed zero value into the correct hex value for zero', () => {
    const tx = getRawTx({ value: '0' })

    expect(tx.value).toBe('0x0')
  })

  it('turns an undefined value into the correct hex value for zero', () => {
    const tx = getRawTx({ value: undefined })

    expect(tx.value).toBe('0x0')
  })

  it('should pass through a hex nonce', () => {
    const tx = getRawTx({ nonce: '0x168' })

    expect(tx.nonce).toBe('0x168')
  })

  it('should convert a valid integer nonce into hex', () => {
    const tx = getRawTx({ nonce: '360' })

    expect(tx.nonce).toBe('0x168')
  })

  it('should pass through an undefined nonce', () => {
    const tx = getRawTx({ nonce: undefined })

    expect(tx.nonce).toBeUndefined()
  })

  const invalidNonces = [
    { description: 'non-numeric', nonce: 'invalid' },
    { description: 'negative integer', nonce: '-360' },
    { description: 'non-integer numeric', nonce: '3.60' }
  ]
  invalidNonces.forEach(({ description, nonce }) => {
    it(`should reject a ${description} nonce`, () => {
      expect(() => getRawTx({ nonce })).toThrowError('Invalid nonce')
    })
  })
})

describe('#getSignedAddress', () => {
  it('returns a verified address for a valid signature', () => {
    const signature =
      '0xa4ba512820eab7022d0c88b9335425b6235c184565c84fb9e451965844a185030baec17ac9565c666675525cae41e367c458c1fdf575a80f6a44197d3b48c0ba1c'
    const message = fromUtf8('Example `personal_sign` message')

    getSignedAddress(signature, message, (err, verifiedAddress) => {
      expect(err).toBeFalsy()
      expect(verifiedAddress.toLowerCase()).toBe('0x3a077715f7383ad97215d1a585778bce6a9aa8af')
    })
  })

  it('returns an error if no signature is provided', () => {
    getSignedAddress(null, 'some message', (err) => {
      expect(err).toBeTruthy()
    })
  })
})
