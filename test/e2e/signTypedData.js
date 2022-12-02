const provider = require('eth-provider')

const TYPED_DATA = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' }
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' }
    ]
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
    },
    contents: 'Hello, Bob!'
  }
}

const main = async () => {
  const ethereum = provider()

  try {
    const accounts = await ethereum.send('eth_accounts')
    console.log({ accounts })

    const signedTypedDataStringified = await ethereum.send('eth_signTypedData_v3', [
      accounts[0],
      JSON.stringify(TYPED_DATA)
    ])
    console.log({ signedTypedDataStringified })

    const signedTypedDataAsObject = await ethereum.send('eth_signTypedData', [accounts[0], TYPED_DATA])
    console.log({ signedTypedDataAsObject })
  } catch (e) {
    if (e.message === 'Unexpected end of JSON input') {
      console.log('Cannot connect to Frame. Is Frame running?')
    } else {
      console.log(e)
    }
  }
}

main()
  .catch((error) => console.error(error))
  .finally(() => process.exit())
