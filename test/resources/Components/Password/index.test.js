import { screen, render } from '../../../componentSetup'
import { CreatePassword, ConfirmPassword } from '../../../../resources/Components/Password'

const validPassword = 'thisisagoodpassword123'

describe('creating password', () => {
  const setupComponent = ({ onCreate = jest.fn() } = {}) => {
    const { user } = render(<CreatePassword {...{ password: validPassword, onCreate }} />, {
      advanceTimersAfterInput: true
    })

    return {
      user,
      getSubmitButton: () => screen.getByRole('button'),
      enterPassword: async (text) => user.type(screen.getByRole('textbox'), text)
    }
  }

  it('should display the correct title when entering the password', () => {
    setupComponent()

    expect(screen.getByRole('heading').textContent).toBe('Create Password')
  })

  it('should show an error when the password is too short', async () => {
    const { enterPassword, getSubmitButton } = setupComponent()

    await enterPassword('INVALID')

    expect(getSubmitButton().textContent).toBe('PASSWORD MUST BE 12 OR MORE CHARACTERS')
  })

  it('should show the warning when the password is too weak', async () => {
    const { enterPassword, getSubmitButton } = setupComponent()

    await enterPassword('aaaaaaaaaaaa')

    expect(getSubmitButton().textContent).toBe('REPEATS LIKE "AAA" ARE EASY TO GUESS')
  })

  it('should show the continue button when a valid password is entered', async () => {
    const { enterPassword, getSubmitButton } = setupComponent()

    await enterPassword(validPassword)

    expect(getSubmitButton().textContent).toBe('Continue')
  })

  it('should call the onCreate function when a password is submitted', async () => {
    const onCreate = jest.fn()
    const { user, enterPassword, getSubmitButton } = setupComponent({ onCreate })

    await enterPassword(validPassword)
    await user.click(getSubmitButton())

    expect(onCreate).toHaveBeenCalledWith(validPassword)
  })
})

describe('confirming password', () => {
  const setupComponent = ({ onConfirm = jest.fn() } = {}) => {
    const { user } = render(<ConfirmPassword {...{ password: validPassword, onConfirm }} />, {
      advanceTimersAfterInput: true
    })

    return {
      user,
      getConfirmButton: () => screen.getByRole('button'),
      enterPassword: async (text) => user.type(screen.getByRole('textbox'), text)
    }
  }
  it('should show an error when the password does not match previously entered password', async () => {
    const { enterPassword, getConfirmButton } = setupComponent()

    await enterPassword('DOES_NOT_MATCH')

    expect(getConfirmButton().textContent).toBe('PASSWORDS DO NOT MATCH')
  })

  it('should show the create button when a valid password is entered', async () => {
    const { enterPassword, getConfirmButton } = setupComponent()

    await enterPassword(validPassword)

    expect(getConfirmButton().textContent).toBe('Create')
  })

  it('should call the onConfirm function when the password is confirmed', async () => {
    const onConfirm = jest.fn()
    const { user, enterPassword, getConfirmButton } = setupComponent({ onConfirm })

    await enterPassword(validPassword)
    await user.click(getConfirmButton())

    expect(onConfirm).toHaveBeenCalledWith(validPassword)
  })
})
