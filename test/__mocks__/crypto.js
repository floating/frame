const original = jest.requireActual('crypto')

const cryptoModule = {
  ...original,
  // generate predictable encrypted keys for verification
  randomBytes: (size) => Buffer.alloc(size).fill(1)
}

module.exports = cryptoModule

export default cryptoModule
