import React from 'react'
import { act } from 'react-dom/test-utils'

import { setupComponent } from '../../../componentSetup'
import { CreatePassword, ConfirmPassword } from '../../../../resources/Components/Password'

const password = 'thisisagoodpassword123'

describe('creating password', () => {
  let submitButton, passwordEntryTextArea, user, getByRole
  const onCreate = jest.fn()

  beforeEach(() => {
    ;({ user, getByRole } = setupComponent(<CreatePassword {...{ password, onCreate }} />))
    passwordEntryTextArea = getByRole('textbox')
    submitButton = getByRole('button')
  })

  it('Should display the correct title when entering the password', () => {
    expect(getByRole('heading').textContent).toBe('Create Password')
  })

  it('Should show an error when the password is too short', async () => {
    await user.type(passwordEntryTextArea, 'INVALID')

    act(() => {
      jest.runAllTimers()
    })

    expect(submitButton.textContent).toBe('PASSWORD MUST BE AT LEAST 12 CHARACTERS LONG')
  })

  it('Should show the warning when the password is too weak', async () => {
    await user.type(passwordEntryTextArea, 'aaaaaaaaaaaa')

    act(() => {
      jest.runAllTimers()
    })

    expect(submitButton.textContent).toBe('REPEATS LIKE "AAA" ARE EASY TO GUESS')
  })

  it('Should show the continue button when a valid password is entered', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    expect(submitButton.textContent).toBe('Continue')
  })

  it('Should call the onCreate function when a password is submitted', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(submitButton)
    expect(onCreate).toHaveBeenCalledWith(password)
  })
})

describe('confirming password', () => {
  let passwordEntryTextArea, confirmButton, user
  const onConfirm = jest.fn()

  beforeEach(() => {
    const component = setupComponent(<ConfirmPassword {...{ password, onConfirm }} />)
    user = component.user
    passwordEntryTextArea = component.getByRole('textbox')
    confirmButton = component.getByRole('button')
  })

  it('Should show an error when the password does not match previously entered password', async () => {
    await user.type(passwordEntryTextArea, 'DOES_NOT_MATCH')
    act(() => {
      jest.runAllTimers()
    })

    expect(confirmButton.textContent).toBe('PASSWORDS DO NOT MATCH')
  })

  it('Should show the create button when a valid password is entered', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    expect(confirmButton.textContent).toBe('create')
  })

  it('Should call the onConfirm function when the password is confirmed', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledWith(password)
  })
})
