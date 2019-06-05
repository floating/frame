const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const hdKey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')

const store = require('../../store')
const crypt = require('../../crypt')

const Seed = require('./Seed')
const Ring = require('./Ring')

const signersPath = path.resolve(app.getPath('userData') + '/signers')

// const getSigners = () => {
//   //console.log('get signers')
//   fs.readdir(signersPath, (err, items) => {
//     if (err) throw err
//     const valid = []
//     items.filter(item => item.endsWith('.json')).forEach(item => {
//       fs.readFile('file', 'utf8', (err, data) => {
//         if (err) return console.error(err)
//         try {
//           data = JSON.parse(data)
//         } catch (err) {
//           return console.error(err)
//         }
//         if (data && data.id && data.type) {
//           let { id, type, seed } = data
//           valid.push({ id, type, seed })
//         } else {
//           console.error(new Error('Invalid signer structure from json'))
//         }
//       })
//     })
//     console.log('items')
//     for (var i = 0; i < items.length; i++) {
//       console.log(items[i])
//     }
//   })
// }
//
// if (fs.existsSync(signersPath)) {
//   getSigners()
// } else {
//   fs.mkdir(signersPath, { recursive: true }, err => {
//     if (err) return console.error(err)
//     getSigners()
//   })
// }

// const saveSigner = (signer, cb) => {
//   console.log('saving', signer)
//   fs.writeFile(signersPath + `/${signer.id}.json`, JSON.stringify(signer), 'utf8', cb)
// }
// saveSigner({ id: 'wew', test: 'ok' }, (err, result) => {
//   if (err) return console.error(err)
//   console.log(result)
// })

const api = {
  newPhrase: () => {
    return bip39.generateMnemonic()
  },
  seedToAddresses: (seed) => {
    const wallet = hdKey.fromMasterSeed(Buffer.from(seed, 'hex')).derivePath('m/44\'/60\'/0\'/0')
    const addresses = []
    for (var i = 0; i < 100; i++) { addresses.push(wallet.deriveChild(i).getWallet().getChecksumAddressString()) }
    return addresses
  },
  createFromSeed: (refs, signers, seed, password, cb) => {
    if (!seed) return cb(new Error('Seed required to create local signer'))
    if (!password) return cb(new Error('Password required to create local signer'))
    const addresses = api.seedToAddresses(seed)
    const id = signers.addressesToId(addresses)
    if (store('main', 'signers', id)) return cb(new Error('Signer already exists'))
    crypt.encrypt(seed.toString('hex'), password, (err, encryptedSeed) => {
      if (err) return cb(err)
      const signer = { id, addresses, type: 'seed', seed: encryptedSeed }
      // console.log('CREATE SIGNER')
      // console.log(signer)
      store.newSigner(signer)
      refs[id] = new Seed(signer, signers)
      cb(null, signer)
    })
  },
  createFromPhrase: (refs, signers, phrase, password, cb) => {
    if (!bip39.validateMnemonic(phrase)) return cb(new Error('Invalid mnemonic phrase')) // Add option to continue anyway
    bip39.mnemonicToSeed(phrase).then(seed => api.createFromSeed(refs, signers, seed, password, cb)).catch(err => cb(err))
  },
  scan: (refs, signers) => {
    try {
      const stored = store('main.signers')
      // console.log('stored')
      // console.log(stored)
      Object.keys(stored).forEach(id => {
        const signer = stored[id]
        if (signer.type === 'seed') {
          refs[id] = new Seed(signer, signers)
        } else if (signer.type === 'ring') {
          refs[id] = new Ring(signer, signers)
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
