const Hot = require('./Hot')

module.exports = signers => {
  signers[0] = new Hot(0)
}
