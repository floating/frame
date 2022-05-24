import { v5 as uuidv5 } from 'uuid'
import log from 'electron-log'

import { updateOrigin } from '../../../main/api/origins'
import store from '../../../main/store'

jest.mock('../../../main/accounts', () => {})
jest.mock('../../../main/store')

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

beforeEach(() => {
  store.initOrigin = jest.fn()
  store.set('main.origins', {})
})

describe('#updateOrigin', () => {
  describe('handling origins', () => {
    it('adds a new origin to the store', () => {
      updateOrigin({}, 'frame.test')

      expect(store.initOrigin).toHaveBeenCalledWith(
        uuidv5('frame.test', uuidv5.DNS),
        {
          name: 'frame.test',
          chain: {
            type: 'ethereum',
            id: 1
          }
        }
      )
    })

    it('does not overwrite an existing origin', () => {
      store.set('main.origins', uuidv5('frame.test', uuidv5.DNS), { chain: {} })

      updateOrigin({}, 'frame.test')

      expect(store.initOrigin).not.toHaveBeenCalled()
    })

    it('does not initialize a new origin on a connection message', () => {
      updateOrigin({}, 'frame.test', true)

      expect(store.initOrigin).not.toHaveBeenCalled()
    })

    it('sets the chainId to mainnet for a new origin', () => {
      const payload = updateOrigin({}, 'frame.test')

      expect(payload.chainId).toBe('0x1')
    })

    it('sets the chainId to mainnet for an unknown origin', () => {
      const payload = updateOrigin({})

      expect(payload.chainId).toBe('0x1')
    })

    it('adds the configured chain for an existing origin to the payload', () => {
      store.set('main.origins', uuidv5('frame.test', uuidv5.DNS), { chain: { id: 137 } })

      const payload = updateOrigin({}, 'frame.test')

      expect(payload.chainId).toBe('0x89')
    })

    it('does not override chainId in the payload with one from a configured origin', () => {
      store.set('main.origins', uuidv5('frame.test', uuidv5.DNS), { chain: { id: 137 } })

      const payload = updateOrigin({ chainId: '0x1' }, 'frame.test')

      expect(payload.chainId).toBe('0x1')
    })
  })

  describe('parsing', () => {
    it('parses an origin using ws:// protocol', () => {
      const parsedPayload = updateOrigin({}, 'ws://frame.eth')

      expect(parsedPayload._origin).toBe(uuidv5('frame.eth', uuidv5.DNS))
    })

    it('parses an origin using wss:// protocol', () => {
      const parsedPayload = updateOrigin({}, 'wss://pylon.frame.eth')

      expect(parsedPayload._origin).toBe(uuidv5('pylon.frame.eth', uuidv5.DNS))
    })

    it('parses an origin using http:// protocol', () => {
      const parsedPayload = updateOrigin({}, 'http://test-case.frame.io')

      expect(parsedPayload._origin).toBe(uuidv5('test-case.frame.io', uuidv5.DNS))
    })

    it('parses an origin using https:// protocol', () => {
      const parsedPayload = updateOrigin({}, 'https://www.google.com')

      expect(parsedPayload._origin).toBe(uuidv5('www.google.com', uuidv5.DNS))
    })

    it('parses an origin using an extension protocol', () => {
      const parsedPayload = updateOrigin({}, 'moz-extension://frame.eth')

      expect(parsedPayload._origin).toBe(uuidv5('frame.eth', uuidv5.DNS))
    })

    it('parses an origin using with no prepended protocol', () => {
      const parsedPayload = updateOrigin({}, 'send.frame.eth')

      expect(parsedPayload._origin).toBe(uuidv5('send.frame.eth', uuidv5.DNS))
    })

    it('treats a lack of origin as unknown', () => {
      const parsedPayload = updateOrigin({})

      expect(parsedPayload._origin).toBe('Unknown')
    })
  })
})
