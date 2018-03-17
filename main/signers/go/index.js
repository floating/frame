const Interface = require('./Interface')

module.exports = signers => {
  signers['go'] = new Interface('go')
}
