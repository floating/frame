import log from 'electron-log'
import { getRawTx } from '../../../main/provider/helpers'

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
})
