const weiToGwei = v => v / 1e9
const gweiToWei =  v => v * 1e9
const intToHex = v => '0x' + v.toString(16)
const hexToInt = v => parseInt(v, 'hex')
const weiHexToGweiInt = v => hexToInt(v) / 1e9
const gweiToWeiHex = v => intToHex(gweiToWei(v))

module.exports = {
  weiToGwei,
  gweiToWei, 
  intToHex,
  hexToInt,
  weiHexToGweiInt, 
  gweiToWeiHex
}