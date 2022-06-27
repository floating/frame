import validatePayload from '../../../main/api/validPayload'

import log from 'electron-log'

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

let payload

beforeEach(() => {
  // this payload is valid
  payload = {
    id: 7,
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: ['0xc93452A74e596e81E4f73Ca1AcFF532089AD4c62'],
  }
})

it('returns a valid payload with a string id', () => {
  payload.id = '12'
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toStrictEqual(payload)
})

it('returns a valid payload with array params', () => {
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toStrictEqual(payload)
})

it('returns a valid payload with object params', () => {
  payload.params = { asset: { address: '0x912a' } }
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toStrictEqual(payload)
})

it('changes missing params to an empty array', () => {
  delete payload.params
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toStrictEqual({
    ...payload,
    params: [],
  })
})

it('is not valid if not a string', () => {
  const result = validatePayload({ test: 'bad-data' })

  expect(result).toBe(false)
})

it('is not valid if payload is null', () => {
  const result = validatePayload(null)

  expect(result).toBe(false)
})

it('is not valid if payload is a null string', () => {
  const result = validatePayload('null')

  expect(result).toBe(false)
})

it('is not valid if payload is not an object', () => {
  const result = validatePayload('["eth_chainId"]')

  expect(result).toBe(false)
})

it('is not valid if payload does not include an id', () => {
  delete payload.id
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toBe(false)
})

it('is not valid if payload id is not a string or number', () => {
  payload.id = { id: 1 }
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toBe(false)
})

it('is not valid if payload does not include a method', () => {
  delete payload.method
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toBe(false)
})

it('is not valid if payload method is not a string', () => {
  payload.method = { eth: 'get_balance' }
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toBe(false)
})

it('is not valid if jsonrpc field is not a string', () => {
  payload.jsonrpc = 2.0
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toBe(false)
})

it('is not valid if params are not an array or objecvt', () => {
  payload.params = 'params'
  const result = validatePayload(JSON.stringify(payload))

  expect(result).toBe(false)
})
