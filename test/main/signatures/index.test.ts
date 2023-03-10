import * as signatureParser from '../../../main/signatures'

describe('#identify', () => {
  let typedMessage

  beforeEach(() => {
    typedMessage = {
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
      }
    }
  })

  it('should successfully identify erc-20 permit signature requests', () => {
    expect(signatureParser.identify(typedMessage)).toBe('signErc20Permit')
  })

  it('should not identify erc-20 permit signature requests with missing domain entries', () => {
    delete typedMessage.data.domain.chainId

    expect(signatureParser.identify(typedMessage)).toBe('signTypedData')
  })

  it('should return the base typed signature type when unable to identify a request', () => {
    typedMessage.data.types.Permit.pop()

    expect(signatureParser.identify(typedMessage)).toBe('signTypedData')
  })

  it('should successfully identfy empty types arrays', () => {
    typedMessage.data.types = []

    expect(signatureParser.identify(typedMessage)).toBe('signTypedData')
  })
})
