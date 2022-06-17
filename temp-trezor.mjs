import Erc20Contract from './compiled/main/contracts/erc20.js'
import ethProvider from 'eth-provider'

const eth = ethProvider()
const contract = new Erc20Contract.default('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', '0x1', eth)

contract.getTokenData().then(console.log)