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
  store.addOriginRequest = jest.fn()
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

    it('assigns a session to a new origin', () => {
      const { hasSession } = updateOrigin({}, 'frame.test')

      expect(hasSession).toBe(true)
    })

    it('does not overwrite an existing origin', () => {
      store.set('main.origins', uuidv5('frame.test', uuidv5.DNS), { chain: { id: 1 } })

      updateOrigin({}, 'frame.test')

      expect(store.initOrigin).not.toHaveBeenCalled()
    })

    it('maintains a session for an existing origin', () => {
      store.set('main.origins', uuidv5('frame.test', uuidv5.DNS), { chain: { id: 1 } })

      const { hasSession } = updateOrigin({}, 'frame.test')

      expect(hasSession).toBe(true)
    })

    it('does not initialize a new origin on a connection message', () => {
      updateOrigin({}, 'frame.test', true)

      expect(store.initOrigin).not.toHaveBeenCalled()
    })

    it('does not assign a session on a connection message', () => {
      const { hasSession } = updateOrigin({}, 'frame.test', true)

      expect(hasSession).toBe(false)
    })

    it('sets the chainId to mainnet for a new origin', () => {
      const { payload } = updateOrigin({}, 'frame.test')

      expect(payload.chainId).toBe('0x1')
    })

    it('sets the chainId to mainnet for an unknown origin', () => {
      const { payload } = updateOrigin({})

      expect(payload.chainId).toBe('0x1')
    })

    it('does not assign a session to an unknown origin', () => {
      const { hasSession } = updateOrigin({})

      expect(hasSession).toBe(false)
    })

    it('adds the configured chain for an existing origin to the payload', () => {
      store.set('main.origins', uuidv5('frame.test', uuidv5.DNS), { chain: { id: 137 } })

      const { payload } = updateOrigin({}, 'frame.test')

      expect(payload.chainId).toBe('0x89')
    })

    it('does not override chainId in the payload with one from a configured origin', () => {
      store.set('main.origins', uuidv5('frame.test', uuidv5.DNS), { chain: { id: 137 } })

      const { payload } = updateOrigin({ chainId: '0x1' }, 'frame.test')

      expect(payload.chainId).toBe('0x1')
    })
  })

  describe('parsing', () => {
    it('parses an origin using ws:// protocol', () => {
      const { payload } = updateOrigin({}, 'ws://frame.eth')

      expect(payload._origin).toBe(uuidv5('frame.eth', uuidv5.DNS))
    })

    it('parses an origin using wss:// protocol', () => {
      const { payload } = updateOrigin({}, 'wss://pylon.frame.eth')

      expect(payload._origin).toBe(uuidv5('pylon.frame.eth', uuidv5.DNS))
    })

    it('parses an origin using http:// protocol', () => {
      const { payload } = updateOrigin({}, 'http://test-case.frame.io')

      expect(payload._origin).toBe(uuidv5('test-case.frame.io', uuidv5.DNS))
    })

    it('parses an origin using https:// protocol', () => {
      const { payload } = updateOrigin({}, 'https://www.google.com')

      expect(payload._origin).toBe(uuidv5('www.google.com', uuidv5.DNS))
    })

    it('parses an origin using an extension protocol', () => {
      const { payload } = updateOrigin({}, 'moz-extension://frame.eth')

      expect(payload._origin).toBe(uuidv5('frame.eth', uuidv5.DNS))
    })

    it('parses an origin using with no prepended protocol', () => {
      const { payload } = updateOrigin({}, 'send.frame.eth')

      expect(payload._origin).toBe(uuidv5('send.frame.eth', uuidv5.DNS))
    })

    it('treats a lack of origin as unknown', () => {
      const { payload } = updateOrigin({})

      expect(payload._origin).toBe('Unknown')
    })
  })
})
