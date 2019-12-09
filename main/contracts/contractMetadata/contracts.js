module.exports = async (contract, to, web3) => {
  if (contract === 'openzeppelin-contracts/ERC20Detailed.json') {
    return require('.openzeppelin-contracts/ERC20Detailed.json')
  } else if (contract === 'aragon-proxy') {
    return require('./aragonProxy')(to, web3)
  }
}
