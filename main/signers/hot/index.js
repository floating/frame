const path = require('path')
const fs = require('fs')
const { app } = require('electron')

const SeedSigner = require('./SeedSigner')
const RingSigner = require('./RingSigner')

// const create = require('worker-farm')(require.resolve('./create'), [ 'newPhrase', 'fromSeed', 'fromPhrase' ])
const create = require('./create')

const api = {
  newPhrase: (cb) => create.newPhrase(cb),
  createFromSeed: (signers, seed, password, cb) => {
    create.fromSeed(seed, password, (err, signer) => {
      if (err) return cb(err)
      this.addSeedSigner(signer, cb)
    })
  },
  createFromPhrase: (signers, phrase, password, cb) => {
    create.fromPhrase(phrase, password, (err, signer) => {
      if (err) return cb(err)
      this.addSeedSigner(signers, signer, cb)
    })
  },
  addSeedSigner: (signers, { addresses, type, seed }, cb) => {
    let signer = new SeedSigner({ addresses, type, seed })
    signer.save()
    signers.add(signer)
    cb(null, signer)
  },
  scan: (signers) => {
    let storedSigners = {}

    // Try to read stored signers from disk
    try {
      const signersPath = path.resolve(app.getPath('userData'), 'signers.json')
      storedSigners = JSON.parse(fs.readFileSync(signersPath, 'utf8'))
    } catch (e) {
      return console.error(e)
    }

    // Add stored signers to store
    Object.keys(storedSigners).forEach(id => {
      const signer = storedSigners[id]
      if (signer.type === 'seed') {
        signers.add(new Seed(signer))
      } else if (signer.type === 'ring') {
        signers.add(new Ring(signer))
      }
    })
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
