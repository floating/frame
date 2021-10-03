import Ledger, { Status } from '../../../../../main/signers/ledger/Ledger'
import Eth from '../../../../../main/signers/ledger/Ledger/eth'
import { Derivation } from '../../../../../main/signers/Signer/derive'

import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { doesNotMatch } from 'assert'

jest.mock('../../../../../main/signers/ledger/Ledger/eth')
jest.mock('@ledgerhq/hw-transport-node-hid')

let ledger

beforeEach(async () => {
  // jest.useFakeTimers()
  Eth.mockClear()

  ledger = new Ledger('usb-path')
  await ledger.open()
})

afterEach(async () => {
  await ledger.close()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('#connect', () => {
  beforeEach(() => {
    Eth.mock.instances[0].getAppConfiguration.mockResolvedValue({ version: '1.9.2' })
  })

  it('sets the status to connecting while checking if the eth app is available', done => {
    ledger.once('update', () => {
      try {
        expect(ledger.status).toBe(Status.INITIAL)
        done()
      } catch (e) { done(e) }
    })

    ledger.connect()
  })

  describe('when the eth app is open', () => {
    it('sets the version', async () => {
      await ledger.connect()
  
      expect(ledger.appVersion).toEqual({
        major: 1, minor: 9, patch: 2
      })
    })

    it('emits an event when beginning to derive addresses', done => {
      let connecting = false

      ledger.on('update', () => {
        if (!connecting) {
          return connecting = ledger.status === Status.INITIAL
        }

        try {
          expect(ledger.addresses).toHaveLength(0)
          expect(ledger.status).toBe(Status.DERIVING)
          done()
        } catch (e) { done(e) }
      })

      ledger.connect()
    })

    it('derives addresses after connecting', done => {
      const addresses = ['0xf10326c1c6884b094e03d616cc8c7b920e3f73e0']
      Eth.mock.instances[0].deriveAddresses.mockResolvedValue(addresses)

      ledger.on('update', () => {
        if (ledger.status === Status.OK) {
          try {
            expect(ledger.addresses).toHaveLength(1)
            expect(ledger.addresses[0]).toBe(addresses[0])
            done()
          } catch (e) { done(e) }
        }
      })

      ledger.derivation = Derivation.legacy
      ledger.connect()
    })
  })
})
