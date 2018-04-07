const Hot = require('./Hot')

module.exports = signers => {
  signers[1] = new Hot(1),
  signers[2] = new Hot(2),
  signers[3] = new Hot(3),
  signers[4] = new Hot(4),
  signers[5] = new Hot(5)
}
