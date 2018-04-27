const Hot = require('./Hot')

const dev = process.env.NODE_ENV === 'development'

module.exports = signers => {
  if (dev) {
    signers[1] = new Hot(1)
    signers[2] = new Hot(2)
    // signers[3] = new Hot(3)
    // signers[4] = new Hot(4)
    // signers[5] = new Hot(5)
    // signers[6] = new Hot(6)
    // signers[7] = new Hot(7)
    // signers[8] = new Hot(8)
    // signers[9] = new Hot(9)
    // signers[10] = new Hot(10)
  }
}
