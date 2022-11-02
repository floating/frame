import { v5 as uuidv5 } from 'uuid'
import log from 'electron-log'

import { parseOrigin, updateOrigin } from '../../../main/api/origins'
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
      const { payload } = updateOrigin({}, 'Unknown')

      expect(payload.chainId).toBe('0x1')
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
      const origin = parseOrigin('ws://frame.eth')

      expect(origin).toBe('frame.eth')
    })

    it('parses an origin using wss:// protocol', () => {
      const origin = parseOrigin('wss://pylon.frame.eth')

      expect(origin).toBe('pylon.frame.eth')
    })

    it('parses an origin using http:// protocol', () => {
      const origin = parseOrigin('http://test-case.frame.io')

      expect(origin).toBe('test-case.frame.io')
    })

    it('parses an origin using https:// protocol', () => {
      const origin = parseOrigin('https://www.google.com')

      expect(origin).toBe('www.google.com')
    })

    it('does not change an origin using an extension protocol', () => {
      const origin = parseOrigin('chrome-extension://tagxpelsfagzmzljsfgmuipalsfaohgpal')

      expect(origin).toBe('chrome-extension://tagxpelsfagzmzljsfgmuipalsfaohgpal')
    })

    it('does not change an origin with no prepended protocol', () => {
      const origin = parseOrigin('send.frame.eth')

      expect(origin).toBe('send.frame.eth')
    })

    it('does not change a plain string origin', () => {
      const origin = parseOrigin('frame-extension')

      expect(origin).toBe('frame-extension')
    })

    it('treats a lack of origin as unknown', () => {
      const origin = parseOrigin(undefined)

      expect(origin).toBe('Unknown')
    })
  })
})
