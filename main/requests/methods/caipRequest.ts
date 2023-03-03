import { addHexPrefix } from '@ethereumjs/util'
import { BigNumber } from 'bignumber.js'
import { z } from 'zod'

import { createRequestMatcher, generateError } from '../matchers'

export const chainIdMatcher = z
  .string()
  .startsWith('eip155:', {
    message: 'Chain ID must be CAIP-2 chain representation and start with "eip155"'
  })
  .transform((id) => addHexPrefix(BigNumber(id.split(':')[1]).toString(16)))

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

  throw generateError(result.error)
}
