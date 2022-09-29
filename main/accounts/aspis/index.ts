import log from 'electron-log'

const Web3EthAbi = require('web3-eth-abi');

import store from '../../store'
import { Provider, TransactionMetadata } from '../../provider'

async function encodeDAOCall(actor: string, pool: string, action: string, data: any) {
  return new Promise<any>(async (resolve, reject) => {
    try {
      
      const jsonInterface = {
        "inputs": [
          {
            "internalType": "address",
            "name": "_target",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "_ethValue",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "_data",
            "type": "bytes"
          }
        ],
        "name": "execute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      };
      const encodedData = Web3EthAbi.encodeFunctionCall(jsonInterface,[data[0], data[1], data[2]]);
      resolve({
        from: actor,
        to: pool,
        data: encodedData,
        gas: 3000000
      })
    } catch (error) {
      
    }
  })
}

async function resolveAspisAddress (name: string) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve({ name: "Aspis DAO", domain: "", apps: { kernel: { proxyAddress: name}, agent: { proxyAddress: name}}, ens: name, network: store('main.currentNetwork.id') })
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

class Aspis {
  dao: Address
  agent: Address
  actor: Address

  provider?: Provider

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
    this.inSetup = true
    this.provider = require('../../provider').default
  }

  pathTransaction (tx: RPC.SendTransaction.TxParams, cb: Callback<RPC.SendTransaction.TxParams>) {
    tx.value = tx.value || '0x'
    tx.data = tx.data || '0x'
    encodeDAOCall(this.actor, this.agent, 'execute', [tx.to, tx.value, tx.data]).then(result => {
      const newTx = result
      if (!newTx) return cb(new Error('Could not calculate a transaction path for Aragon smart account, make sure your acting account has the necessary permissions'))
      delete newTx.nonce
      newTx.chainId = tx.chainId

      if (this.provider) {
        this.provider.getNonce(newTx, res => {
          if (res.error) return cb(new Error(res.error.message))
          newTx.nonce = res.result

          if (this.provider) {
            console.log("===============================fill transaction===============")
            console.log(newTx)
            this.provider.fillTransaction(newTx, (err, fullTx) => {
              if (err) return cb(err)

              const filledTx = (fullTx as TransactionMetadata).tx

              const value = filledTx.value !== undefined ? filledTx.value : '0x'
              cb(null, { ...filledTx, value })
            })
          }
        })
      }
    }).catch(cb)
  }
}

export { Aspis, resolveAspisAddress }
