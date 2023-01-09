import { SignTypedDataVersion } from '@metamask/eth-sig-util'
import * as signatureParser from '../../../main/signatures'
describe('#identify', () => {
  let request

  beforeEach(() => {
    request = {
      handlerId: 'a4728bfb-783a-40d2-a206-e10fed2c039c',
      type: 'signErc20Permit',
      typedMessage: {
        data: {
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' }
            ],
            Permit: [
              { name: 'owner', type: 'address' },
              { name: 'spender', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' }
            ]
          },
          primaryType: 'Permit',
          domain: {
            name: 'USD Coin',
            verifyingContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: 1,
            version: '2'
          },
          message: {
            deadline: 1673347398,
            nonce: 0,
            spender: '0x1111111254eeb25477b68fb85ed929f73a960582',
            owner: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
            value: '115792089237316195423570985008687907853269984665640564039457584007913129639935'
          }
        },
        version: 'V4' as SignTypedDataVersion
      },
      payload: {
        id: 148,
        method: 'eth_signTypedData_v4',
        params: [
          '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
          {
            types: {
              EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
              ],
              Permit: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' }
              ]
            },
            primaryType: 'Permit',
            domain: {
              name: 'USD Coin',
              verifyingContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              chainId: 1,
              version: '2'
            },
            message: {
              deadline: 1673347398,
              nonce: 0,
              spender: '0x1111111254eeb25477b68fb85ed929f73a960582',
              owner: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
              value: '115792089237316195423570985008687907853269984665640564039457584007913129639935'
            }
          }
        ],
        jsonrpc: '2.0',
        chainId: '0x1',
        _origin: '66d85ed4-3e14-54ee-b041-efec2e173731'
      },
      account: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      origin: '66d85ed4-3e14-54ee-b041-efec2e173731'
    }
  })

  it('should successfully identify ERC20 Permit signature requests', () => {
    const type = signatureParser.identify(request.typedMessage)
    expect(type).toBe('signErc20Permit')
  })

  it('should return the base typed signature type when unable to identify a request', () => {
    request.typedMessage.data.types.Permit.pop()
    const type = signatureParser.identify(request.typedMessage)

    expect(type).toBe('signTypedData')
  })

  it('should successfully identfy empty types arrays', () => {
    request.typedMessage.data.types = []
    const type = signatureParser.identify(request.typedMessage)

    expect(type).toBe('signTypedData')
  })
})
