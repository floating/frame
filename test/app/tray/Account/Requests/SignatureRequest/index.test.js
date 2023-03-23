import { screen, render } from '../../../../../componentSetup'
import SignatureRequestComponent from '../../../../../../app/tray/Account/Requests/SignatureRequest'

let req

beforeEach(() => {
  req = {
    type: 'sign',
    data: {}
  }
})

it('displays a message to sign', () => {
  req.data.decodedMessage = 'hello, world!'

  render(<SignatureRequestComponent req={req} />)
  expect(screen.getByText('hello, world!')).toBeTruthy()
})
