import { latest as OriginsSchema } from '../../../../../main/store/state/types/origins'

const validOrigin = {
  chain: {
    id: 42161,
    type: 'ethereum'
  },
  name: 'Fun Arb Dapp',
  session: {
    requests: 28,
    startedAt: 1628600000000,
    endedAt: 1628820000000,
    lastUpdatedAt: 1629020000000
  }
}

it('defaults to an empty object for an empty state', () => {
  const origins = OriginsSchema.parse(undefined)

  expect(origins).toStrictEqual({})
})

it('defaults to an empty object for a corrupt state', () => {
  const origins = OriginsSchema.parse([])

  expect(origins).toStrictEqual({})
})

it('parses a valid origin', () => {
  const origins = OriginsSchema.parse({ originid: validOrigin })

  expect(origins).toStrictEqual({
    originid: { ...validOrigin, session: expect.any(Object) }
  })
})

it('removes an invalid origin from the state', () => {
  const invalidOrigin = {
    chain: 'Mainnet',
    name: 'Swapping dapp',
    session: {}
  }

  const origins = OriginsSchema.parse({ valid: validOrigin, invalid: invalidOrigin })

  expect(origins).toStrictEqual({
    valid: { ...validOrigin, session: expect.any(Object) }
  })
})

it('removes unknown origins from the state', () => {
  const unknownOriginId = '332ad0bf-a0f2-5e61-aaea-8cb024e574a3'

  const origins = OriginsSchema.parse({ [unknownOriginId]: validOrigin })

  expect(origins).toStrictEqual({})
})

it('resets session data for a known origin', () => {
  const { originid: origin } = OriginsSchema.parse({ originid: validOrigin })

  expect(origin.session).toStrictEqual({
    requests: 0,
    startedAt: 0,
    lastUpdatedAt: 0,
    endedAt: validOrigin.session.lastUpdatedAt
  })
})
