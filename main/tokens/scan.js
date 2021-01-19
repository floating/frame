const ethProvider = require('eth-provider')
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

  Object.keys(tokensBalance).forEach(token => {
    const index = tokensBalance[token] ? tokenAddresses.indexOf(token) : -1
    if (index > -1) {
      found[token] = mainnetTokens[index]
      found[token].balance = tokensBalance[token].toString()
      const d = found[token].decimals
      const s = padLeft(tokensBalance[token], d + 1)
      const p = s.length - d
      found[token].displayBalance = padRight(s.substring(0, p) + '.' + s.substring(p, p + (d < 8 ? d : 8)), p + 9)
    }
  })
  return found
}

module.exports = scan