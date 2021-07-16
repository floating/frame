


module.exports = async function createGasPrices ({ standard, asap, slow = standard, fast = standard, custom = standard }) {
  const asap = asap || ('0x' + (hexToBn(basePrice).add(ONE_GWEI).mul(new BN(1.2))).toString('hex'))
  return {
    slow,
    standard,
    fast,
    asap,
    custom: customGasLevel(network.id, network.type) || gas.standard,
  }
}