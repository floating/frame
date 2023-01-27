import { addHexPrefix } from '@ethereumjs/util'
import { BigNumber } from 'bignumber.js'
import { z } from 'zod'

const Caip27Request = z.object({
  id: z.number(),
  jsonrpc: z.literal('2.0'),
  method: z.literal('caip_request'),
  params: z.object({
    chainId: z.string(),
    session: z.string(),
    request: z.object({
      method: z.string(),
      params: z.any()
    })
  })
})

function fromCaip2ChainId(id: Caip2ChainId) {
  const chainId = BigNumber(id.split(':')[1])
  return addHexPrefix(chainId.toString(16))
}

export function isCaip27Request(payload: RPCRequestPayload) {
  return Caip27Request.safeParse(payload).success
}

export function mapCaip27Request(request: Caip27JsonRpcRequest): RPCRequestPayload {
  const { jsonrpc, id, _origin } = request

  return {
    jsonrpc,
    id,
    method: request.params.request.method,
    params: request.params.request.params,
    chainId: fromCaip2ChainId(request.params.chainId),
    _origin
  }
}
