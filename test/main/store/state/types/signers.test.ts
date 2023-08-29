import { latest as SignersSchema } from '../../../../../main/store/state/types/signers'

const validSigner = {
  id: 'my-ledger',
  name: 'Secure ledger signer',
  model: 'Nano X',
  type: 'ledger',
  addresses: ['0x1234'],
  status: 'pending',
  createdAt: 0
}

it('parses a valid signer', () => {
  expect(SignersSchema.parse({ 'my-ledger': validSigner })).toStrictEqual({ 'my-ledger': validSigner })
})

it('removes an invalid signer from the state', () => {
  const invalidSigner = {
    ...validSigner,
    type: 'bogus'
  }

  expect(SignersSchema.parse({ 'my-ledger': validSigner, 'your-ledger': invalidSigner })).toStrictEqual({
    'my-ledger': validSigner
  })
})
