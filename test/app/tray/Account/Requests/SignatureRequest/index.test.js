import { screen, render } from '../../../../../componentSetup'
import SignatureRequestComponent from '../../../../../../app/tray/Account/Requests/SignatureRequest'

let req

beforeEach(() => {
  req = {
    type: 'sign',
    payload: {
      params: ['0x5E9999142A3368A7E8308142cFED2Ed62b0aB29d']
    }
  }
})

it('displays a plaintext message', () => {
  req.payload.params.push('hello, world!')

  render(<SignatureRequestComponent req={req} />)
  expect(screen.getByText('hello, world!')).toBeTruthy()
})

it('displays a hex-encoded message', () => {
  req.payload.params.push('0x' + Buffer.from('hello, world!', 'utf8').toString('hex'))

  render(<SignatureRequestComponent req={req} />)
  expect(screen.getByText('hello, world!')).toBeTruthy()
})

it('displays a raw hex string', () => {
  req.payload.params.push('0xdeadbeef')

  render(<SignatureRequestComponent req={req} />)
  expect(screen.queryByText('hello, world!')).toBeFalsy()
  expect(screen.getByText('0xdeadbeef')).toBeTruthy()
})
