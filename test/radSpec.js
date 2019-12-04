const provider = require('eth-provider')
const Web3EthContract = require('web3-eth-contract')

const abi = [
  {
    'constant': false,
    'inputs': [
      { 'internalType': 'address', 'name': 'recipient', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }
    ],
    'name': 'transfer',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
]

const main = async () => {
  try {
    const ethereum = provider()
    const accounts = await ethereum.send('eth_accounts')
    console.log({ accounts })
    Web3EthContract.setProvider(ethereum)

    const antContract = new Web3EthContract(
      abi,
      '0x960b236A07cf122663c4303350609A66A7B288C0'
    )

    const result = await antContract.methods.transfer(
      '0xfD85b83369E72512A34E23fc575b96761a11F9fD', '100000000'
    ).send({
      from: accounts[0],
      gasPrice: 1000000,
      gas: 8000000
    })

    console.log(result)
  } catch (e) {
    if (e.message === 'Unexpected end of JSON input') {
      console.log('Cannot connect to Frame. Is Frame running?')
    } else {
      console.log(e)
    }
  }
}

main().catch(error => console.error(error)).finally(() => process.exit())
