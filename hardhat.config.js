/* globals task */
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
    async ({ amount, chain = 4, to = '0xf2C1E45B6611bC4378c3502789957A57e0390B79', provider = 'frame' }) => {
      const requestTimeout = new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error('request timed out!')), 60 * 1000)
      )

      const sendRequest = async () => {
        const chainId = '0x' + parseInt(chain).toString(16)
        const eth = ethProvider(provider === 'hardhat' ? 'http://127.0.0.1:8545' : provider, {
          origin: 'frame-hardhat-worker'
        })

        const accounts = await eth.request({
          method: 'eth_accounts',
          params: [],
          id: 2,
          jsonrpc: '2.0'
        })

        const tx = {
          value: utils.parseEther(amount || '.0002').toHexString(),
          from: accounts[0],
          to,
          data: '0x'
        }

        const req = {
          id: 2,
          jsonrpc: '2.0',
          method: 'wallet_request',
          params: {
            chainId: `eip155:${parseInt(chainId, 16)}`,
            request: {
              method: 'eth_sendTransaction',
              params: [tx]
            }
          }
        }

        const txHash = await eth.request(req)

        console.log(`success! tx hash: ${txHash}`)
      }

      return Promise.race([requestTimeout, sendRequest()])
    }
  )

taskWithDefaultParams('send-token-approval', 'approve token contract for spending')
  .addOptionalParam('contract', 'address of token contract')
  .addOptionalParam('amount', 'amount to approve')
  .addOptionalParam('decimals', 'number of decimals to pad amount (default 18)')
  .setAction(
    async ({
      provider = 'frame',
      chain = 1,
      amount = 1000,
      decimals = 6,
      contract = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    }) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('request timed out!')), 60 * 1000)

        const chainId = '0x' + parseInt(chain).toString(16)
        const eth = ethProvider(provider === 'hardhat' ? 'http://127.0.0.1:8545' : provider, {
          origin: 'frame-hardhat-worker'
        })
        const abi = new utils.Interface(['function approve(address spender, uint256 value)'])

        const bnAmount = ethers.BigNumber.from(amount).mul(ethers.BigNumber.from(10).pow(parseInt(decimals)))

        eth
          .request({ method: 'eth_accounts', params: [], id: 2, chainId, jsonrpc: '2.0' })
          .then((accounts) => {
            const data = abi.encodeFunctionData('approve', [accounts[0], bnAmount])

            return {
              value: '0x0',
              from: accounts[0],
              to: contract,
              data
            }
          })
          .then((tx) => {
            console.log({ tx })
            return eth.request({ method: 'eth_sendTransaction', params: [tx], id: 2, chainId })
          })
          .then(resolve)
          .catch(reject)
      })
    }
  )

const ensAbis = require('./compiled/main/contracts/deployments/ens/abi.js')
const registrarContract = new utils.Interface(ensAbis.registrar)
const registrarControllerContract = new utils.Interface(ensAbis.registrarController)

const ensActions = {
  commit: () => {
    return {
      to: '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5',
      data: registrarControllerContract.encodeFunctionData('commit', [
        utils.formatBytes32String('testing-frame')
      ])
    }
  },
  register: ({ name, account, duration = 31536000 }) => {
    return {
      to: '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5',
      data: registrarControllerContract.encodeFunctionData('register', [
        name,
        account,
        duration,
        utils.formatBytes32String('asupersecret')
      ])
    }
  },
  renew: ({ name, duration = 31536000 }) => {
    return {
      to: '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5',
      data: registrarControllerContract.encodeFunctionData('renew', [name, duration])
    }
  },
  transfer: ({ account, to, tokenid }) => {
    return {
      to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      data: registrarContract.encodeFunctionData('transferFrom', [account, to, tokenid])
    }
  },
  approve: ({ to, tokenid }) => {
    return {
      to: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
      data: registrarContract.encodeFunctionData('approve', [to, tokenid])
    }
  }
}

taskWithDefaultParams('ens', 'interact with ENS contracts')
  .addPositionalParam('action', `one of <${Object.keys(ensActions).join('|')}>`)
  .addOptionalParam('name', 'ens domain name')
  .addOptionalParam('to', 'destination account')
  .addOptionalParam('duration', 'duration for action, in seconds')
  .addOptionalParam('tokenid', 'token id for ERC-721 representaion of domain name')
  .setAction(async (params) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('request timed out!')), 60 * 1000)

      const chainId = '0x' + parseInt(params.chain || 1).toString(16)
      const eth = ethProvider(params.provider === 'hardhat' ? 'http://127.0.0.1:8545' : params.provider, {
        origin: 'frame-hardhat-worker'
      })

      eth
        .request({ method: 'eth_accounts', params: [], id: 2, chainId, jsonrpc: '2.0' })
        .then((accounts) => {
          const contractCall = ensActions[params.action]({ ...params, account: accounts[0] })
          return {
            value: '0x0',
            from: accounts[0],
            ...contractCall
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
        blockNumber: 9161860
      }
    },
    arbitrum: {
      url: 'http://localhost:1248',
      gasPrice: 0
    }
  },
  solidity: '0.8.4'
}
