module.exports = {
  weiToGwei: v => Math.ceil(v / 1e9),
  gweiToWei: v => Math.ceil(v * 1e9),
  intToHex: v => '0x' + v.toString(16),
  hexToInt: v => parseInt(v, 'hex'),
  weiHexToGweiInt: v => hexToInt(v) / 1e9,
  gweiToWeiHex: v => intToHex(gweiToWei(v))
}