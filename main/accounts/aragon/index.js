const log = require('electron-log')
const utils = require('ethereumjs-util')
const Wrapper = require('@aragon/wrapper').default
const { ensResolve } = require('@aragon/wrapper')
const store = require('../../store')

const appNames = require('./appNames')

const registryAddress = () => {
  const network = store('main.connection.network')
  const addresses = {
    1: '0x314159265dd8dbb310642f98f50c066173c1259b',
    4: '0x98df287b6c145399aaa709692c8d308357bc085d'
  }
  if (addresses[network]) return addresses[network]
  throw new Error('Unable to locate Aragon ENS registry for current network')
}

const resolveAragon = async (domain, registryAddress) => {
  return new Promise(async (resolve, reject) => {
    try {
      let address = await ensResolve(domain, { provider: require('../../provider'), registryAddress })
      if (address.replace('0x', '')) return resolve(address)
      throw new Error('Invalid address')
    } catch (e) {
      reject(new Error(`Unable to resolve DAO ${domain} on current network`))
    }
  })
}

const resolveName = (name) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Look up registry address based on current network connection
      const domain = name.indexOf('.') > -1 ? name : `${name}.aragonid.eth`
      const options = {
        apm: {
          ipfs: {
            gateway: 'https://ipfs.eth.aragon.network/ipfs'
          },
          ensRegistryAddress: registryAddress()
        }
      }
      const address = await resolveAragon(domain, options.apm.ensRegistryAddress)
      const wrap = new Wrapper(address, options)
      await wrap.init()
      const subscription = wrap.apps.subscribe(apps => {
        subscription.unsubscribe()
        const appsSummary = {}
        apps.forEach(app => {
          const { appId, proxyAddress } = app
          const name = appNames[appId]
          if (name) appsSummary[name] = { proxyAddress }
        })
        if (!appsSummary['kernel']) return reject(new Error('Unable to locate DAO kernel'))
        if (!appsSummary['agent']) return reject(new Error('Unable to locate DAO agent, make sure it is installed'))
        resolve({ name: domain.split('.')[0], domain, apps: appsSummary, ens: address, network: store('main.connection.network') })
      })
    } catch (e) {
      reject(e)
    }
  })
}

class Aragon {
  constructor ({ name, apps, dao, agent, actor, ens }) {
    this.dao = dao
    this.agent = agent
    this.actor = actor
    const options = {
      apm: {
        ipfs: {
          gateway: 'https://ipfs.eth.aragon.network/ipfs'
        },
        ensRegistryAddress: registryAddress()
      }
    }
    const wrap = new Wrapper(dao, options)
    wrap.init().then(() => { this.wrap = wrap }).catch(err => log.error(err))
    setTimeout(() => { this.provider = require('../../provider') }, 0)
  }

  bufferToHex (value) {
    return utils.bufferToHex(value)
  }

  pathTransaction (tx, cb) {
    if (!this.wrap) return cb(new Error('Aragon wrapper not ready'))
    this.wrap.calculateTransactionPath(this.actor.address, this.agent, 'execute', [tx.to, tx.value, tx.data]).then(result => {
      var newTx = result[0]
      delete newTx.nonce
      this.provider.getNonce(newTx, res => {
        if (res.error) return cb(res.error)
        newTx.nonce = res.result
        if (typeof newTx.value === 'undefined') newTx.value = '0x'
        if (typeof newTx.gasPrice === 'undefined') newTx.gasPrice = tx.gasPrice
        cb(null, newTx)
      })
    }).catch(cb)
  }

  aragonSignMessage (message, cb) {
    this.aragon((err, wrap) => {
      if (err) return cb(err)
      const params = ['0x' + utils.keccak(message).toString('hex')]
      wrap.calculateTransactionPath(this.smart.actor.address, this.smart.agent, 'presignHash', params).then(result => {
        log.warn('Trying to sign as Aragon DAO...', result)
      }).catch(cb)
    })
  }
}

module.exports = { Aragon, resolveName }
