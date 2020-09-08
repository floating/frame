const log = require('electron-log')
const utils = require('ethereumjs-util')
const Wrapper = require('@aragon/wrapper').default
const { ensResolve } = require('@aragon/wrapper')
const store = require('../../store')

const appNames = require('./appNames')

const registryAddress = () => {
  const network = store('main.connection.network')
  const addresses = {
    1: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    4: '0x98df287b6c145399aaa709692c8d308357bc085d'
  }
  if (addresses[network]) return addresses[network]
  throw new Error('Unable to locate Aragon ENS registry for current network')
}

const resolveAragon = async (domain, registryAddress) => {
  const executor = async (resolve, reject) => {
    try {
      const address = await ensResolve(domain, { provider: require('../../provider'), registryAddress })
      if (address.replace('0x', '')) return resolve(address)
      throw new Error('Invalid address')
    } catch (e) {
      reject(new Error(`Unable to resolve DAO ${domain} on current network`))
    }
  }
  return new Promise(executor)
}

const resolveName = (name) => {
  const executor = async (resolve, reject) => {
    try {
      // Look up registry address based on current network connection
      const domain = name.indexOf('.') > -1 ? name : `${name}.aragonid.eth`
      const options = {
        provider: require('../../provider'),
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
        if (!appsSummary.kernel) return reject(new Error('Unable to locate DAO kernel'))
        if (!appsSummary.agent) return reject(new Error('Unable to locate DAO agent, make sure it is installed'))
        resolve({ name: domain.split('.')[0], domain, apps: appsSummary, ens: address, network: store('main.connection.network') })
      })
    } catch (e) {
      reject(e)
    }
  }
  return new Promise(executor)
}

class Aragon {
  constructor ({ name, apps, dao, agent, actor, ens }, network) {
    this.dao = dao
    this.agent = agent
    this.actor = actor
    this.network = network
    store.observer(() => this.setup())
  }

  setup () {
    const connection = store('main.connection')
    const status = [connection.local.status, connection.secondary.status]
    if (status.indexOf('connected') > -1 && this.network === connection.network && !this.wrap && !this.inSetup) {
      log.info('\n ** Setting Up Aragon DAO:', this.dao)
      this.inSetup = true
      this.provider = require('../../provider')
      const options = {
        provider: this.provider,
        apm: { ipfs: { gateway: 'https://ipfs.eth.aragon.network/ipfs' }, ensRegistryAddress: registryAddress() }
      }
      const wrap = new Wrapper(this.dao, options)
      wrap.init().then(() => {
        this.wrap = wrap
        this.inSetup = false
      }).catch(err => {
        log.error(err)
        this.inSetup = false
      })
    }
  }

  bufferToHex (value) {
    return utils.bufferToHex(value)
  }

  pathTransaction (tx, cb) {
    if (!this.wrap) {
      this.setup()
      return cb(new Error('Aragon wrapper was not ready or is not on correct network, try again'))
    }
    tx.value = tx.value || '0x'
    tx.data = tx.data || '0x'

    //    if no eth is included AND web3.eth.gasEstimate({ from: agent, to: target, data: calldata }) returns a bounded amount
    //        run with 'safeExecute'
    //          if no path/result found
    //            run with 'execute'
    //    else
    //      run with 'execute'

    this.wrap.calculateTransactionPath(this.actor.address, this.agent, 'execute', [tx.to, tx.value, tx.data]).then(result => {
      var newTx = result[0]
      delete newTx.nonce
      newTx.chainId = tx.chainId
      this.provider.getNonce(newTx, res => {
        if (res.error) return cb(res.error)
        newTx.nonce = res.result
        this.provider.fillTx(newTx, (err, fullTx) => {
          if (err) return cb(err)
          if (typeof fullTx.value === 'undefined') fullTx.value = '0x'
          cb(null, fullTx)
        })
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

  processSignedMessage (cb) {
    return (err, msg) => {
      if (err) return cb(err)
      cb(null, '0x01' + msg.substring(2))
    }
  }
}

module.exports = { Aragon, resolveName }
