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

  it('does not identify a CAIP-27 request with the wrong method', () => {
    const req = {
      ...request,
      method: 'eth_sendTransaction'
    }

    expect(mapCaip27Request(req)).toBeUndefined()
  })

  it('does not identify a CAIP-27 request with an incorrect chain id param', () => {
    const { session, request: payload } = request.params

    const req = {
      ...request,
      params: {
        chainId: '0x1',
        session,
        request: payload
      }
    }

    expect(mapCaip27Request(req)).toBeUndefined()
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

    expect(mapCaip27Request(req)).toBeUndefined()
  })
})
