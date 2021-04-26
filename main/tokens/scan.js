/* globals fetch */

const nebula = require('../nebula')
const ethProvider = require('eth-provider')
const log = require('electron-log')
const getTokenBalances = require('./balance')
const { tokens } = require('./tokens.json')

const mainnetTokens = tokens.filter(t => t.chainId === 1)
const tokenAddresses = mainnetTokens.map(t => t.address.toLowerCase())

const provider = ethProvider('frame', { name: 'tokenWorker' })

async function chainId () {
  return parseInt(await provider.request({ method: 'eth_chainId' }))
}

const padLeft = (num, length) => {
  num = num.toString()
  while (num.length < length) num = '0' + num
  return num
}

const padRight = (num = '', length) => {
  num = num.toString()
  while (num.length < length) num = num + '0'
  return num
}

async function getTokenList (chainId) {
  //const tokenListRecord = await nebula.resolve('tokens.matt.eth')
  //const tokenList = await nebula.ipfs.getJson(tokenListRecord.record.content)

  const tokenList = await nebula.ipfs.getJson('bafybeibmgaqwhvah5nrknqcck6wrbbl7dnyhgcssoqpryetlpqild5i6pe')

  return tokenList.tokens.filter(t => t.chainId === chainId)
}

const scan = async (address, omitList = [], knownList) => {
  const omit = omitList.map(a => a.toLowerCase())
  const list = (knownList || tokenAddresses).map(a => a.toLowerCase()).filter(a => omit.indexOf(a) === -1)

  const chain = await chainId()
  const tokens = await getTokenList(chain)
  const tokenBalances = await getTokenBalances(chain, address, tokens)

  const found = Object.entries(tokenBalances).reduce((found, [symbol, balance]) => {
    if (balance.isZero()) return found

    const token = tokens.find(t => t.symbol === symbol)

    if (token) {
      found[symbol] = { ...token }
      found[symbol].balance = balance
      found[symbol].displayBalance = balance.toString()
      found[symbol].usdRate = 0
      found[symbol].usdValue = 0
      found[symbol].usdDisplayValue = '$0.00'
    }

    return found
  }, {})

  try {
    const _rates = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${Object.keys(found).join(',')}&vs_currencies=usd`)
    const rates = await _rates.json()
    Object.keys(rates).forEach(token => {
      if (found[token]) {
        found[token].usdRate = rates[token].usd || 0
        const usdRateString = rates[token].usd.toString()
        found[token].usdDisplayRate = '$' + (parseInt(usdRateString.split('.')[0])).toLocaleString() + '.' + padRight(usdRateString.split('.')[1], 2)
        found[token].usdValue = Math.floor(found[token].floatBalance * found[token].usdRate * 100) / 100
        const usdValueString = found[token].usdValue.toString()
        found[token].usdDisplayValue = '$' + (parseInt(usdValueString.split('.')[0])).toLocaleString() + '.' + padRight(usdValueString.split('.')[1], 2)
      }
    })
  } catch (e) {
    log.error(e)
  }

  return found
}

module.exports = scan
