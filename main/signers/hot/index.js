const Hot = require('./Hot')

module.exports = signers => {
  try {
    let hot = require('../../../hot.json')
    if (hot && hot.accounts) {
      hot.accounts.forEach(key => {
        if (key != null) signers[key] = new Hot(key)
      })
    }
  } catch (e) {}
}
