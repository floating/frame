import { addHexPrefix } from '@ethereumjs/util'
import { BigNumber } from 'bignumber.js'
import { z } from 'zod'

const Caip27Request = z.object({
  id: z.number(),
  jsonrpc: z.literal('2.0'),
  method: z.union([z.literal('caip_request'), z.literal('wallet_request')], {
    errorMap: () => ({ message: 'Invalid method for CAIP-27 request' })
  }),
  params: z.object({
    chainId: z.union([
      z
        .string()
        .startsWith('eip155:', {
          message: 'Chain ID must be CAIP-2 chain representation and start with "eip155"'
        })
        .transform((id) => addHexPrefix(BigNumber(id.split(':')[1]).toString(16))),
      z.string().regex(/0x[\da-f]/i),
      z
        .string()
        .regex(/^\d+$/)
        .transform((id) => addHexPrefix(parseInt(id).toString(16)))
    ]),

    session: z.string(),
    request: z.object({
      method: z.string(),
      params: z.any()
    })
  })
})

export function mapCaip27Request(rpcRequest: RPCRequestPayload) {
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

  const errorMessage = result.error.issues[0].message

  throw new Error(errorMessage)
}
