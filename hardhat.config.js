require("@nomiclabs/hardhat-waffle");

const { utils } = require('ethers')
const ethProvider = require('eth-provider');

task('send-tx', 'send a test transaction')
  .addOptionalParam('provider', 'eth provider to use for connection')
  .addOptionalParam('to', 'account to send to')
  .addOptionalParam('amount', 'amount to send, in eth')
  .setAction(async ({ amount, to = '0xf2C1E45B6611bC4378c3502789957A57e0390B79', provider = 'frame' }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('request timed out!')), 60 * 1000)

    const eth = ethProvider(provider === 'hardhat' ? 'http://127.0.0.1:8545' : provider)

    eth.request({ method: 'eth_accounts', params: [], id: 2, jsonrpc: '2.0' })
      .then(accounts => ({
        value: utils.parseEther(amount || '.0002').toHexString(),
        from: accounts[0],
        to,
        data: '0x'
      }))
      .then(tx => eth.request({ method: 'eth_sendTransaction', params: [tx], id: 2 }))
      .then(txHash => {
        console.log(`success! tx hash: ${txHash}`)
        return txHash
      })
      .then(resolve)
      .catch(reject)
    })
})

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      hardfork: 'london',
      initialBaseFeePerGas: 1_000_000_000,
      forking: {
        url: 'https://eth-rinkeby.alchemyapi.io/v2/NBms1eV9i16RFHpFqQxod56OLdlucIq0',
        blockNumber: 9161860
      }
    },
    arbitrum: {
      url: 'http://localhost:1248',
      gasPrice: 0,
    },
  },
  solidity: '0.8.4',
}
