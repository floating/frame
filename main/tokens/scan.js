const ethProvider = require('eth-provider')
const log = require('electron-log')
const { getTokensBalance } = require('@mycrypto/eth-scan')
const { tokens } = require('./tokens.json')

const mainnetTokens = tokens.filter(t => t.chainId === 1)
const tokenAddresses = mainnetTokens.map(t => t.address.toLowerCase())

const provider = ethProvider()

const _provider = { // Until eth-scan supports EIP-1193
  call: async ({ to, data }) => {
    return await provider.request({
      method: 'eth_call',
      params: [{ to, data }, 'latest']
    })
  }
}

const padLeft = (num, length) => {
  num = num.toString()
  while (num.length < length) num = '0' + num
  return num 
}

const padRight = (num, length) => {
  num = num.toString()
  while (num.length < length) num = num + '0'
  return num 
}

const scan = async (address, omitList = [], knownList) => {
  const found = {}
  
  const omit = omitList.map(a => a.toLowerCase())
  const list = (knownList || tokenAddresses).map(a => a.toLowerCase()).filter(a => omit.indexOf(a) === -1)

  const tokensBalance = await getTokensBalance(_provider, address, list)

  Object.keys(tokensBalance).forEach(async token => {
    const index = tokensBalance[token] ? tokenAddresses.indexOf(token) : -1
    if (index > -1) {
      found[token] = mainnetTokens[index]
      found[token].balance = tokensBalance[token].toString()
      const d = found[token].decimals
      const s = padLeft(tokensBalance[token], d + 1)
      const p = s.length - d
      found[token].displayBalance = parseInt(s.substring(0, p)).toLocaleString() + '.' + padRight(s.substring(p, d > 7 ? 7 : d), 2)
      found[token].floatBalance = s.substring(0, p) + '.' + padRight(s.substring(p, d > 7 ? 7 : d), 2)
      found[token].usdRate = 0
    }
  })

  try {
    const _rates = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${Object.keys(found).join(',')}&vs_currencies=usd`)
    const rates = await _rates.json()
    Object.keys(rates).forEach(token => {
      if (found[token]) {
        found[token].usdRate = rates[token].usd || 0
        found[token].usdValue = Math.floor(found[token].floatBalance * found[token].usdRate)
        found[token].usdDisplayValue = '$' + Math.floor(found[token].usdValue).toLocaleString()
      }
    })
  } catch (e) {
    log.error(e)
    found[token].usdRate = 0
    found[token].usdValue = 0
    found[token].usdDisplayValue = '$0'
  }
  return found
}

module.exports = scan