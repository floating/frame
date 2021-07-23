require("@nomiclabs/hardhat-waffle");

const { utils } = require('ethers')
const ethProvider = require('eth-provider')


task('send-tx', 'send a test transaction')
  .addParam('amount', 'amount to send, in eth')
  .setAction(async ({ amount }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('request timed out!')), 60 * 1000)

    const eth = ethProvider()

    eth.request({ method: 'eth_accounts' })
      .then(accounts => ({
        value: utils.parseEther(amount || '.0002').toHexString(),
        from: accounts[0],
        to: '0x5837ec9a54f71B6be9a304115CcDE7a07b666438',
        data: '0x',
        gasLimit: '0x5208',
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
        url: 'https://eth-rinkeby.alchemyapi.io/v2/NBms1eV9i16RFHpFqQxod56OLdlucIq0'
      }
    },
    arbitrum: {
      url: 'http://localhost:1248',
      gasPrice: 0,
    },
  },
  solidity: '0.8.4',
}
