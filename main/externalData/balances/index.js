const provider = require('eth-provider')('frame', { name: 'scanWorker' })
const BigNumber = require('bignumber.js')
const log = require('electron-log')

const tokenLoader = require('../inventory/tokens')
const multicall = require('../../multicall')

async function chainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

async function getNativeCurrencyBalance (address) {
  const rawBalance = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })
  const balance = { balance: BigNumber(rawBalance).shiftedBy(-18) }

  // TODO how to shift the balance, are all coins the same?
  return { address, balance, chainId: await chainId() }
}

function balanceCalls (owner, tokens) {
  return tokens.map(token => ({
    target: token.address,
    call: ['balanceOf(address)(uint256)', owner],
    returns: [[`${token.address.toUpperCase()}_BALANCE`, val => new BigNumber(val).shiftedBy(-token.decimals)]]
  }))
}

async function loadTokenBalances (chainId, address, tokens) {
  const calls = balanceCalls(address, tokens)
  const BATCH_SIZE = 3000

  const numBatches = Math.ceil(calls.length / BATCH_SIZE)

  // multicall seems to time out sometimes with very large requests, so batch them
  const fetches = [...Array(numBatches).keys()].map(async (_, batchIndex) => {
    const batchStart = batchIndex * BATCH_SIZE
    const batchEnd = batchStart + BATCH_SIZE

    try {
      const results = await multicall(chainId).call(calls.slice(batchStart, batchEnd))
      return Object.entries(results.transformed)
    } catch (e) {
      log.error(`unable to load token balances (batch ${batchStart}-${batchEnd}`, e)
      return []
    }
  })

  const fetchResults = await Promise.all(fetches)
  const balanceResults = [].concat(...fetchResults)

  return balanceResults
    .reduce((balances, [key, balance]) => {
      const address = key.split('_')[0].toLowerCase()
      balances[address] = balance

      return balances
    }, {})
}

async function getTokenBalances (address, omit = [], knownTokens) {
  const symbolsToOmit = omit.map(a => a.toLowerCase())

  const chain = await chainId()
  const tokenList = tokenLoader.getTokens(chain)
  const tokens = tokenList.filter(t => !symbolsToOmit.includes(t.symbol.toLowerCase()))

  const foundTokens = await loadTokenBalances(chain, address, tokens)

  const tokenBalances = Object.entries(foundTokens).reduce((found, [addr, balance]) => {
    const address = addr.toLowerCase()
    const token = tokens.find(t => t.address === address)

    if (balance.isZero()) return found

    if (token) {
      found[address] = {
        ...token,
        balance
      }
    }

    return found
  }, {})

  return { networkId: chain, balances: tokenBalances }
}

tokenLoader.start()

module.exports = {
  getNativeCurrencyBalance,
  getTokenBalances
}
