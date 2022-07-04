require('@nomiclabs/hardhat-waffle')

const { ethers, utils } = require('ethers')
const ethProvider = require('eth-provider')

function taskWithDefaultParams(taskName, taskDescription) {
  return task(taskName, taskDescription)
    .addOptionalParam('provider', 'eth provider to use for connection')
    .addOptionalParam('chain', 'chain ID of chain for transaction')
}

taskWithDefaultParams('send-tx', 'send a test transaction')
  .addOptionalParam('to', 'account to send to')
  .addOptionalParam('amount', 'amount to send, in eth')
  .setAction(
    async ({
      amount,
      chain = 4,
      to = '0xf2C1E45B6611bC4378c3502789957A57e0390B79',
      provider = 'frame',
    }) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('request timed out!')), 60 * 1000)

        const chainId = '0x' + parseInt(chain).toString(16)
        const eth = ethProvider(provider === 'hardhat' ? 'http://127.0.0.1:8545' : provider, {
          origin: 'frame-hardhat-worker',
        })

        eth
          .request({ method: 'eth_accounts', params: [], id: 2, chainId, jsonrpc: '2.0' })
          .then((accounts) => ({
            value: utils.parseEther(amount || '.0002').toHexString(),
            from: accounts[0],
            to,
            data: '0x',
          }))
          .then((tx) =>
            eth.request({ method: 'eth_sendTransaction', params: [tx], id: 2, chainId })
          )
          .then((txHash) => {
            console.log(`success! tx hash: ${txHash}`)
            return txHash
          })
          .then(resolve)
          .catch(reject)
      })
    }
  )

taskWithDefaultParams('send-token-approval', 'approve token contract for spending')
  .addOptionalParam('contract', 'address of token contract')
  .addOptionalParam('amount', 'amount to approve')
  .addOptionalParam('decimals', 'number of decimals to pad amount (default 18)')
  .setAction(async ({ provider = 'frame', chain = 1, amount = 1000, decimals = 18, contract }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('request timed out!')), 60 * 1000)

      const chainId = '0x' + parseInt(chain).toString(16)
      const eth = ethProvider(provider === 'hardhat' ? 'http://127.0.0.1:8545' : provider, {
        origin: 'frame-hardhat-worker',
      })
      const abi = new utils.Interface(['function approve(address spender, uint256 value)'])

      const bnAmount = ethers.BigNumber.from(amount).mul(
        ethers.BigNumber.from(10).pow(parseInt(decimals))
      )

      eth
        .request({ method: 'eth_accounts', params: [], id: 2, chainId, jsonrpc: '2.0' })
        .then((accounts) => {
          const data = abi.encodeFunctionData('approve', [accounts[0], bnAmount])

          return {
            value: '0x0',
            from: accounts[0],
            to: contract,
            data,
          }
        })
        .then((tx) => {
          console.log({ tx })
          return eth.request({ method: 'eth_sendTransaction', params: [tx], id: 2, chainId })
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
        blockNumber: 9161860,
      },
    },
    arbitrum: {
      url: 'http://localhost:1248',
      gasPrice: 0,
    },
  },
  solidity: '0.8.4',
}
