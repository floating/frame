import { mapCaip27Request } from '../../../main/requests'

describe('#mapCaip27Request', () => {
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
    expect(mapCaip27Request(request)).toStrictEqual({
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

  it('identifies a CAIP-27 request using the caip_request method', () => {
    const req = {
      ...request,
      method: 'caip_request'
    }

    expect(mapCaip27Request(req)).toBeTruthy()
  })

  it('identifies a CAIP-27 request using the wallet_request method', () => {
    const req = {
      ...request,
      method: 'wallet_request'
    }

    expect(mapCaip27Request(req)).toBeTruthy()
  })

  it('does not identify a CAIP-27 using an unsupported method', () => {
    const req = {
      ...request,
      method: 'eth_sendTransaction'
    }

    expect(() => mapCaip27Request(req)).toThrowError(/invalid method for caip-27 request/i)
  })

  it('identifies a request with a CAIP-2 compliant chain param', () => {
    const { session, request: payload } = request.params

    const req = {
      ...request,
      params: {
        chainId: 'eip155:10',
        session,
        request: payload
      }
    }

    expect(mapCaip27Request(req).chainId).toBe('0xa')
  })

  it('identifies a request with a hex chain param', () => {
    const { session, request: payload } = request.params

    const req = {
      ...request,
      params: {
        chainId: '0x5',
        session,
        request: payload
      }
    }

    expect(mapCaip27Request(req).chainId).toBe('0x5')
  })

  it('identifies a request with a numeric chain param', () => {
    const { session, request: payload } = request.params

    const req = {
      ...request,
      params: {
        chainId: '137',
        session,
        request: payload
      }
    }

    expect(mapCaip27Request(req).chainId).toBe('0x89')
  })

  it('does not identify a CAIP-27 request with an incorrect chain id param', () => {
    const { session, request: payload } = request.params

    const req = {
      ...request,
      params: {
        chainId: 'achain',
        session,
        request: payload
      }
    }

    expect(() => mapCaip27Request(req)).toThrowError()
  })

  it('does not identify a CAIP-27 request with no chain id param', () => {
    const { session, request: payload } = request.params

    const req = {
      ...request,
      params: {
        session,
        request: payload
      }
    }

    expect(() => mapCaip27Request(req)).toThrowError()
  })
})
