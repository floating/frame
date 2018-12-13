const Keyring = require('./Keyring')

module.exports = signers => {
  //try {
    let keyring = require('../../../keyring.json')
    if (keyring && keyring.accounts) {
      keyring.accounts.forEach(key => {
        if (key != null) signers[key.id] = new Keyring(key)
      })
    }
  //} catch (e) {}
}
