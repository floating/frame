const log = require('electron-log')
const utils = require('ethereumjs-util')
const Wrapper = require('@aragon/wrapper').default

class Aragon {
  constructor ({ dao, agent, actor, ens }) {
    this.dao = dao
    this.agent = agent
    this.actor = actor
    ens = '0x98df287b6c145399aaa709692c8d308357bc085d'
    const wrap = new Wrapper(dao, { apm: { ensRegistryAddress: ens } })
    wrap.init().then(() => { this.wrap = wrap }).catch(err => log.error(err))
    setTimeout(() => { this.provider = require('../../../provider') }, 0)
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
        console.log(result)
      }).catch(cb)
    })
  }
}

module.exports = Aragon
