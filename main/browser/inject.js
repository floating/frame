const Web3 = require('web3')
const provider = require('eth-provider')
window.web3 = new Web3(provider('frame'))
