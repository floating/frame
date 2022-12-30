import React from 'react'
import { act } from 'react-dom/test-utils'

import { setupComponent, user, screen } from '../../../componentSetup'
import { CreatePassword, ConfirmPassword } from '../../../../resources/Components/Password'

const password = 'thisisagoodpassword123'

describe('creating password', () => {
  let submitButton, passwordEntryTextArea
  const onCreate = jest.fn()

  beforeEach(() => {
    setupComponent(<CreatePassword {...{ password, onCreate }} />)
    passwordEntryTextArea = screen.getByRole('textbox')
    submitButton = screen.getByRole('button')
  })

  it('Should display the correct title when entering the password', () => {
    expect(screen.getByRole('heading').textContent).toBe('Create Password')
  })

  it('Should show an error when the password is too short', async () => {
    await user.type(passwordEntryTextArea, 'INVALID')

    act(() => {
      jest.runAllTimers()
    })

    expect(submitButton.textContent).toBe('PASSWORD MUST BE 12 OR MORE CHARACTERS')
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
  let passwordEntryTextArea, confirmButton
  const onConfirm = jest.fn()

  beforeEach(() => {
    setupComponent(<ConfirmPassword {...{ password, onConfirm }} />)
    passwordEntryTextArea = screen.getByRole('textbox')
    confirmButton = screen.getByRole('button')
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

    expect(confirmButton.textContent).toBe('Create')
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
