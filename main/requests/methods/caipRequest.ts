import { addHexPrefix } from '@ethereumjs/util'
import { BigNumber } from 'bignumber.js'
import { z } from 'zod'

import { createRequestMatcher } from '../matchers'

export const chainIdMatcher = z.union([
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
])

export const sessionMatcher = z.string()

const caipRequestParams = z.object({
  chainId: chainIdMatcher,
  session: sessionMatcher,
  request: z.object({
    method: z.string(),
    params: z.any()
  })
})

const Caip27Request = createRequestMatcher('caip_request', caipRequestParams)

export default function (rpcRequest: RPCRequestPayload) {
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
