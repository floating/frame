const store = require('../../../store')
const Wrapper = require('@aragon/wrapper').default
const first = require('rxjs/operators').first

const addressesEqual = (first, second) => {
  first = first && first.toLowerCase()
  second = second && second.toLowerCase()
  return first === second
}

const registryAddress = () => {
  const network = store('main.connection.network')
  const addresses = {
    1: '0x314159265dd8dbb310642f98f50c066173c1259b',
    4: '0x98df287b6c145399aaa709692c8d308357bc085d'
  }
  if (addresses[network]) return addresses[network]
  throw new Error('Unable to locate Aragon ENS registry for current network')
}

module.exports = async function (to, web3) {
  const proxy = new web3.eth.Contract(require('./AppProxyBase.json').abi, to)
  const kernel = await proxy.methods.kernel().call()
  const options = {
    provider: require('../../../provider'),
    apm: {
      ipfs: {
        gateway: 'https://ipfs.eth.aragon.network/ipfs'
      },
      ensRegistryAddress: registryAddress()
    }
  }
  const wrap = new Wrapper(kernel, options)
  await wrap.init()
  const apps = await wrap.apps.pipe(first()).toPromise()
  console.log(apps)
  const app = apps.find((app) => addressesEqual(app.proxyAddress, to))
  if (!app) return console.log('NO APP FOUND')
  var detailed = {
    abi: app.abi,
    userdoc: {
      methods: {}
    }
  }
  app.functions.forEach(func => { detailed.userdoc.methods[func.sig] = { notice: func.notice } })
  console.log(detailed)
  return detailed
}
