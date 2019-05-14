const store = require('../../store')
const Seed = require('./Seed')
const Ring = require('./Ring')

module.exports = signers => {
  try {
    const stored = store('main._signers')
    Object.keys(stored).forEach(id => {
      const signer = stored[id]
      if (signer.type === 'seed') {
        signers[id] = new Seed(signer)
      } else if (signer.type === 'ring') {
        signers[id] = new Ring(signer)
      }
    })
  } catch (e) {}
}
