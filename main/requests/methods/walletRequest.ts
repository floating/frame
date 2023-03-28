import { z } from 'zod'
import { createRequestMatcher } from '../matchers'

import { chainIdMatcher, sessionMatcher } from './caipRequest'

const walletRequestParams = z.object({
  chainId: z.optional(chainIdMatcher),
  session: z.optional(sessionMatcher),
  request: z.object({
    method: z.string(),
    params: z.any()
  })
})

const WalletRequest = createRequestMatcher('wallet_request', walletRequestParams)

export default function (rpcRequest: RPCRequestPayload) {
  const result = WalletRequest.safeParse(rpcRequest)

  if (result.success) {
    const walletRequest = result.data

    const { jsonrpc, id, _origin } = rpcRequest
    const { request, chainId } = walletRequest.params
    const { method, params } = request

    const optionalParams = {
      ...(chainId && { chainId })
    }

    return {
      jsonrpc,
      id,
      method,
      params,
      _origin,
      ...optionalParams
    }
  }

  const errorMessage = result.error.issues[0].message

  throw new Error(errorMessage)
}
