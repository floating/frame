const Hot = require('./Hot')

module.exports = signers => {
  signers[0] = new Hot(0),
  signers[2] = new Hot(2),
  signers[3] = new Hot(3)
}
