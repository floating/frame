const { createWatcher, aggregate } = require('@makerdao/multicall')

const contractAddresses = {
  1: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441', // mainnet
  4: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821', // rinkeby,
  5: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e', // goerli
  42: '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a', // kovan,
  100: '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a', // xdai,
  137: '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507' // polygon
}

function chainConfig (chainId) {
  return {
    rpcUrl: 'http://0.0.0.0:1248', // Frame
    multicallAddress: contractAddresses[chainId]
  }
}

module.exports = function (chainId) {
  const config = chainConfig(chainId)

  return {
    call: async function (calls) {
      return (await aggregate(calls, config)).results
    },
    subscribe: function (calls, cb) {
      const watcher = createWatcher(calls, config)

      watcher.subscribe(update => cb(null, update))
      watcher.onError(cb)

      watcher.start()

      return watcher
    }
  }
}
