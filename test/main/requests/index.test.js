import { isCaip27Request, mapCaip27Request } from '../../../main/requests'

describe('#isCaip27Request', () => {
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

  it('identifies a valid CAIP-27 request', () => {
    expect(isCaip27Request(request)).toBe(true)
  })

  it('does not identify a CAIP-27 request with the wrong method', () => {
    const req = {
      ...request,
      method: 'eth_sendTransaction'
    }

    expect(isCaip27Request(req)).toBe(false)
  })

  it('does not identify a CAIP-27 request with no chain id param', () => {
    const { session, request: payload } = request.params

    const req = {
      ...request,
      params: {
        session,
        payload
      }
    }

    expect(isCaip27Request(req)).toBe(false)
  })
})

describe('#mapCaip27Request', () => {
  it('maps a CAIP-27 complicant RPC request into an internal representation', () => {
    const caip27Request = {
      jsonrpc: '2.0',
      id: 8,
      method: 'caip_request',
      _origin: 'frame.eth',
      params: {
        chainId: 'eip155:1',
        request: {
          method: 'personal_sign',
          params: [
            '0x68656c6c6f20776f726c642c207369676e2074657374206d65737361676521',
            '0xa89Df33a6f26c29ea23A9Ff582E865C03132b140'
          ]
        }
      }
    }

    expect(mapCaip27Request(caip27Request)).toStrictEqual({
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
})
