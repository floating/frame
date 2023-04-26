const original = jest.requireActual('crypto')

export default {
  ...original,
  // generate predictable encrypted keys for verification
  randomBytes: (size) => Buffer.alloc(size).fill(1)
}
