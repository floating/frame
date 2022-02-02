import log from 'electron-log'

import Wrapper, { ensResolve } from '@aragon/wrapper'

import store from '../../store'
import appNames from './appNames'
import { Provider } from '../../provider'
import { TransactionData } from '../../transaction'

function getNetworkId () {
  return parseInt(store('main.currentNetwork.id') || '0')
}

function registryAddress () {
  const network = getNetworkId()

  const addresses: Record<number, Address> = {
    1: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    3: '0x6afe2cacee211ea9179992f89dc61ff25c61e923',
    4: '0x98df287b6c145399aaa709692c8d308357bc085d',
    74: '0xede729eff031bc9f1a36f4361cd0d9585c9dc5f9',
    100: '0xaafca6b0c89521752e559650206d7c925fd0e530',
    137: '0x3c70a0190d09f34519e6e218364451add21b7d4b',
    80001: '0x431f0eed904590b176f9ff8c36a1c4ff0ee9b982'
  }

  if (addresses[network]) return addresses[network]
  throw new Error('Unable to locate Aragon ENS registry for current network')
}

async function resolveAragon (domain: string, registryAddress: Address) {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const address = await ensResolve(domain, { provider: require('../../provider').default, registryAddress })
      if (address.replace('0x', '')) return resolve(address)
      throw new Error('Invalid address')
    } catch (e) {
      reject(new Error(`Unable to resolve DAO ${domain} on current network`))
    }
  })
}

async function resolveName (name: string) {
  return new Promise(async (resolve, reject) => {
    try {
      // Look up registry address based on current network connection
      const domain = name.indexOf('.') > -1 ? name : `${name}.aragonid.eth`
      const options = {
        provider: require('../../provider').default,
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
        const appsSummary: Record<string, Record<string, string>> = {}
        apps.forEach(app => {
          const { appId, proxyAddress } = app
          const name = appNames[appId]
          if (name) appsSummary[name] = { proxyAddress }
        })
        if (!appsSummary.kernel) return reject(new Error('Unable to locate DAO kernel'))
        if (!appsSummary.agent) return reject(new Error('Unable to locate DAO agent, make sure it is installed'))
        resolve({ name: domain.split('.')[0], domain, apps: appsSummary, ens: address, network: store('main.currentNetwork.id') })
      })
    } catch (e) {
      reject(e)
    }
  })
}

export interface AragonOptions {
  dao: Address,
  agent: Address,
  actor: Address
}

class Aragon {
  dao: Address
  agent: Address
  actor: Address

  provider?: Provider
  wrap?: Wrapper

  inSetup = false

  constructor (opts: AragonOptions) {
    this.dao = opts.dao
    this.agent = opts.agent
    this.actor = opts.actor // Actor is now just the acting accounts address

    store.observer(() => this.setup())
  }

  setup () {
    const { type, id } = store('main.currentNetwork')
    const connection = store('main.networks', type, id, 'connection')
    const status = [connection.primary.status, connection.secondary.status]
    if (status.indexOf('connected') > -1 && !this.wrap && !this.inSetup) {
      setTimeout(() => {
        log.info('\n ** Setting Up Aragon DAO:', this.dao)
        this.inSetup = true
        this.provider = require('../../provider').default
        let options
        try {
          options = {
            provider: this.provider,
            apm: { ipfs: { gateway: 'https://ipfs.eth.aragon.network/ipfs' }, ensRegistryAddress: registryAddress() }
          }
        } catch (e) {
          console.log('TODO: If Aragon smart account setup fails disable it for current network', e)
          return 
        }
        const wrap = new Wrapper(this.dao, options)
        wrap.init().then(() => {
          this.wrap = wrap
          this.inSetup = false
        }).catch((err: any) => {
          log.error(err)
          this.inSetup = false
        })
      }, 50)
    }
  }

  pathTransaction (tx: RPC.SendTransaction.TxParams, cb: Callback<RPC.SendTransaction.TxParams>) {
    if (!this.wrap) {
      this.setup()
      return cb(new Error('Aragon wrapper was not ready or is not on correct network, try again'))
    }
    tx.value = tx.value || '0x'
    tx.data = tx.data || '0x'
    this.wrap.calculateTransactionPath(this.actor, this.agent, 'execute', [tx.to, tx.value, tx.data]).then(result => {
      const newTx = result[0]
      if (!newTx) return cb(new Error('Could not calculate a transaction path for Aragon smart account, make sure your acting account has the necessary permissions'))
      delete newTx.nonce
      newTx.chainId = tx.chainId

      if (this.provider) {
        this.provider.getNonce(newTx, res => {
          if (res.error) return cb(new Error(res.error.message))
          newTx.nonce = res.result

          if (this.provider) {
            this.provider.fillTransaction(newTx, (err, fullTx) => {
              if (err) return cb(err)

              const filledTx = fullTx as TransactionData

              const value = filledTx.value !== undefined ? filledTx.value : '0x'
              cb(null, { ...filledTx, value })
            })
          }
        })
      }
    }).catch(cb)
  }
}

export { Aragon, resolveName }
