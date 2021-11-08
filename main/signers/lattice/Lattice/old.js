const crypto = require('crypto')
const log = require('electron-log')
const utils = require('web3-utils')
const { padToEven, stripHexPrefix, addHexPrefix } = require('ethereumjs-util')
const { Client } = require('gridplus-sdk')
const { promisify } = require('util')
const { sign, signerCompatibility, londonToLegacy } = require('../../../transaction')

const store = require('../../../store')
const Signer = require('../../Signer').default

const ADDRESS_LIMIT = 10
const HARDENED_OFFSET = 0x80000000

function humanReadable (str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) < 0x0020 || str.charCodeAt(i) > 0x007f) { return false }
  }
  return true
}

class Lattice extends Signer {


  async signTypedData (index, version, typedData, cb) {
    const versionNum = (version.match(/[Vv](\d+)/) || [])[1]

    if ((parseInt(versionNum) || 0) < 4) {
      return cb(new Error(`Invalid version (${version}), Lattice only supports eth_signTypedData version 4+`), undefined)
    }

    try {
      const signature = await this._signMessage(index, 'eip712', typedData)

      return cb(null, signature)
    } catch (err) {
      return cb(new Error(err))
    }
  }

  _createTransaction (index, txType, chainId, tx) {
    const { value, to, data, ...txJson } = tx.toJSON()
    const type = utils.hexToNumber(txType)

    const unsignedTx = {
      to,
      value,
      data,
      chainId,
      nonce: utils.hexToNumber(txJson.nonce),
      gasLimit: utils.hexToNumber(txJson.gasLimit),
      useEIP155: true,
      signerPath: this._getPath(index)
    }

    if (type) {
      unsignedTx.type = type
    }

    const optionalFields = ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']

    optionalFields.forEach(field => {
      if (txJson[field]) {
        unsignedTx[field] = utils.hexToNumber(txJson[field])
      }
    })

    return unsignedTx
  }

  async signTransaction (index, rawTx, cb) {
    const compatibility = signerCompatibility(rawTx, this.summary())
    const latticeTx = compatibility.compatible ? { ...rawTx } : londonToLegacy(rawTx)

    sign(latticeTx, tx => {
      const unsignedTx = this._createTransaction(index, rawTx.type, latticeTx.chainId, tx)
      const signOpts = { currency: 'ETH', data: unsignedTx }
      const clientSign = promisify(this.client.sign).bind(this.client)

      return clientSign(signOpts).then(result => ({
        v: result.sig.v.toString('hex'),
        r: result.sig.r,
        s: result.sig.s
      }))
    })
    .then(signedTx => cb(null, addHexPrefix(signedTx.serialize().toString('hex'))))
    .catch(err => {
      log.error('error signing transaction with Lattice', err)
      cb(new Error(`Failed to sign transaction: ${err}`))
    })
  }
}

module.exports = Lattice
