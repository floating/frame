import { latest as DappsSchema } from '../../../../../main/store/state/types/dapps'

const validDapp = {
  id: 'mydapp-12',
  ens: 'mydapp.eth',
  status: 'initial',
  config: {},
  content: 'someipfshash',
  manifest: {},
  openWhenReady: true,
  checkStatusRetryCount: 5
}

it('defaults to an empty object for an empty state', () => {
  expect(DappsSchema.parse(undefined)).toStrictEqual({})
})

it('defaults to an empty object for a corrupt state', () => {
  expect(DappsSchema.parse([])).toStrictEqual({})
})

it('updates valid dapp state to app defaults', () => {
  const { dappid: dapp } = DappsSchema.parse({ dappid: validDapp })
  const { openWhenReady, checkStatusRetryCount } = dapp

  expect(openWhenReady).toBe(false)
  expect(checkStatusRetryCount).toBe(0)
})

it('removes an invalid dapp from the state', () => {
  const invalidDapp = {
    ...validDapp,
    status: 'bogus'
  }

  const dapps = DappsSchema.parse({ valid: validDapp, invalid: invalidDapp })

  expect(Object.keys(dapps)).toStrictEqual(['valid'])
})
