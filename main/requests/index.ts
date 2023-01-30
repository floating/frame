import { addHexPrefix } from '@ethereumjs/util'
import { BigNumber } from 'bignumber.js'
import { z } from 'zod'

const Caip27Request = z.object({
  id: z.number(),
  jsonrpc: z.literal('2.0'),
  method: z.literal('caip_request'),
  params: z.object({
    chainId: z
      .string()
      .startsWith('eip155:', {
        message: 'Chain ID must be CAIP-2 chain representation and start with "eip155"'
      })
      .transform((id) => addHexPrefix(BigNumber(id.split(':')[1]).toString(16))),
    session: z.string(),
    request: z.object({
      method: z.string(),
      params: z.any()
    })
  })
})

export function mapCaip27Request(rpcRequest: RPCRequestPayload): RPCRequestPayload | undefined {
  const result = Caip27Request.safeParse(rpcRequest)

  if (result.success) {
    const caip27Request = result.data

    const { jsonrpc, id, _origin } = rpcRequest
    const { chainId, request } = caip27Request.params
    const { method, params } = request

    return {
      jsonrpc,
      id,
      method,
      params,
      chainId,
      _origin
    }
  }
}
