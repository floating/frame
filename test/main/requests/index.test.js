import { mapRequest } from '../../../main/requests'

describe('#mapRequest', () => {
  it('passes through a request that does require mapping', () => {
    const request = {
      jsonrpc: '2.0',
      id: 4,
      method: 'eth_signTransaction',
      params: ['atx']
    }

    expect(mapRequest(request)).toStrictEqual(request)
  })

  describe('caip_request', () => {
    const request = {
      jsonrpc: '2.0',
      id: 8,
      method: 'caip_request',
      _origin: 'frame.eth',
      params: {
        chainId: 'eip155:1',
        session: '',
        request: {
          method: 'personal_sign',
          params: [
            '0x68656c6c6f20776f726c642c207369676e2074657374206d65737361676521',
            '0xa89Df33a6f26c29ea23A9Ff582E865C03132b140'
          ]
        }
      }
    }

    it('maps a CAIP-27 compliant RPC request into an internal representation', () => {
      expect(mapRequest(request)).toStrictEqual({
        jsonrpc: '2.0',
        id: 8,
        method: 'personal_sign',
        params: [
          '0x68656c6c6f20776f726c642c207369676e2074657374206d65737361676521',
          '0xa89Df33a6f26c29ea23A9Ff582E865C03132b140'
        ],
        chainId: '0x1',
        _origin: 'frame.eth'
      })
    })

    it('maps a request with a CAIP-2 compliant chain param', () => {
      const { session, request: payload } = request.params

      const req = {
        ...request,
        params: {
          chainId: 'eip155:10',
          session,
          request: payload
        }
      }

      expect(mapRequest(req).chainId).toBe('0xa')
    })

    it('maps a request with a hex chain param', () => {
      const { session, request: payload } = request.params

      const req = {
        ...request,
        params: {
          chainId: '0x5',
          session,
          request: payload
        }
      }

      expect(mapRequest(req).chainId).toBe('0x5')
    })

    it('maps a request with a numeric chain param', () => {
      const { session, request: payload } = request.params

      const req = {
        ...request,
        params: {
          chainId: '137',
          session,
          request: payload
        }
      }

      expect(mapRequest(req).chainId).toBe('0x89')
    })

    it('does not map a request with an incorrect chain id param', () => {
      const { session, request: payload } = request.params

      const req = {
        ...request,
        params: {
          chainId: 'achain',
          session,
          request: payload
        }
      }

      expect(() => mapRequest(req)).toThrowError()
    })

    it('does not map a request with no chain id param', () => {
      const { session, request: payload } = request.params

      const req = {
        ...request,
        params: {
          session,
          request: payload
        }
      }

      expect(() => mapRequest(req)).toThrowError()
    })

    it('does not map a request with no session param', () => {
      const { chainId, request: payload } = request.params

      const req = {
        ...request,
        params: {
          chainId,
          request: payload
        }
      }

      expect(() => mapRequest(req)).toThrowError()
    })
  })

  describe('wallet_request', () => {
    const request = {
      jsonrpc: '2.0',
      id: 8,
      method: 'wallet_request',
      _origin: 'frame.eth',
      params: {
        chainId: 'eip155:11155111',
        session: '0xdeadbeef',
        request: {
          method: 'personal_sign',
          params: [
            '0x68656c6c6f20776f726c642c207369676e2074657374206d65737361676521',
            '0xa89Df33a6f26c29ea23A9Ff582E865C03132b140'
          ]
        }
      }
    }

    it('maps a wallet_request into an internal representation', () => {
      expect(mapRequest(request)).toStrictEqual({
        jsonrpc: '2.0',
        id: 8,
        method: 'personal_sign',
        params: [
          '0x68656c6c6f20776f726c642c207369676e2074657374206d65737361676521',
          '0xa89Df33a6f26c29ea23A9Ff582E865C03132b140'
        ],
        chainId: '0xaa36a7',
        _origin: 'frame.eth'
      })
    })

    it('allows a wallet_request with no chain id', () => {
      const { chainId, ...params } = request.params
      const req = {
        ...request,
        params
      }

      expect(mapRequest(req)).toStrictEqual({
        jsonrpc: '2.0',
        id: 8,
        method: 'personal_sign',
        params: [
          '0x68656c6c6f20776f726c642c207369676e2074657374206d65737361676521',
          '0xa89Df33a6f26c29ea23A9Ff582E865C03132b140'
        ],
        _origin: 'frame.eth'
      })
    })

    it('allows a wallet_request with no session', () => {
      const { session, ...params } = request.params
      const req = {
        ...request,
        params
      }

      expect(mapRequest(req)).toStrictEqual({
        jsonrpc: '2.0',
        id: 8,
        method: 'personal_sign',
        params: [
          '0x68656c6c6f20776f726c642c207369676e2074657374206d65737361676521',
          '0xa89Df33a6f26c29ea23A9Ff582E865C03132b140'
        ],
        chainId: '0xaa36a7',
        _origin: 'frame.eth'
      })
    })
  })
})
