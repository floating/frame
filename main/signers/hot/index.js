const store = require('../../store')

const Seed = require('./Seed')
const Ring = require('./Ring')

const create = require('worker-farm')(require.resolve('./create'), [ 'newPhrase', 'fromSeed', 'fromPhrase' ])

// const signersPath = path.resolve(app.getPath('userData') + '/signers')
const api = {
  newPhrase: (cb) => {
    create.newPhrase(cb)
  },
  createFromSeed: (signers, seed, password, cb) => {
    create.fromSeed(seed, password, (err, signer) => {
      if (err) return cb(err)
      let { addresses, type, seed } = signer
      let newSigner = new Seed({ addresses, type, seed })
      signers.add(newSigner)
      cb(null, newSigner)
    })
  },
  createFromPhrase: (signers, phrase, password, cb) => {
    create.fromPhrase(phrase, password, (err, signer) => {
      if (err) return cb(err)
      let { addresses, type, seed } = signer
      let newSigner = new Seed({ addresses, type, seed })
      signers.add(newSigner)
      cb(null, newSigner)
    })
  },
  scan: (signers) => {
    try {
      const stored = store('main.savedSigners')
      Object.keys(stored).forEach(id => {
        const signer = stored[id]
        if (signer.type === 'seed') {
          signers.add(new Seed(signer))
        } else if (signer.type === 'ring') {
          signers.add(new Ring(signer))
        }
      })
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = api

// require('fs').readFile('emails.json', 'utf8', (err, data) => {
//               if (err || !data) {
//                 console.log('error reading file', err)
//                 // data = {emails: []}
//                 return cb(new Error('Email Signup Failed'))
//               } else {
//                 data = JSON.parse(data)
//               }
//               data.emails.push(email)
//               fs.writeFile('emails.json', JSON.stringify(data), 'utf8', (err, result) => {
//                 if (err) {
//                   console.log(err)
//                   cb(new Error('Email Signup Failed'))
//                 } else {
//                   cb()
//                 }
//               })
