import mapCaipRequest from './methods/caipRequest'
import mapWalletRequest from './methods/walletRequest'

export function mapRequest(requestPayload: RPCRequestPayload): RPCRequestPayload {
  if (requestPayload.method === 'caip_request') {
    return mapCaipRequest(requestPayload)
  }

  if (requestPayload.method === 'wallet_request') {
    return mapWalletRequest(requestPayload)
  }

  return requestPayload
}
