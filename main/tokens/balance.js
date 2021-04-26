const multicall = require('../multicall')

const BigNumber = require('bignumber.js')

function balanceCalls (owner, tokens) {
  return tokens.map(token => ({
    target: token.address,
    call: ['balanceOf(address)(uint256)', owner],
    returns: [[`${token.symbol.toUpperCase()}_BALANCE`, val => new BigNumber(val).shiftedBy(-token.decimals)]]
  }))
}

async function getTokenBalances (chainId, address, tokens) {
  const calls = balanceCalls(address, tokens)
  const results = await multicall(chainId).call(calls)

  const balances = Object.entries(results.transformed)
    .reduce((balances, [key, balance]) => {
      const symbol = key.split('_')[0]
      balances[symbol] = balance

      return balances
    }, {})

  return balances
}

module.exports = getTokenBalances
