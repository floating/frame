import React from 'react'
import { act } from 'react-dom/test-utils'

import { setupComponent } from '../../../componentSetup'
import { CreatePassword, ConfirmPassword } from '../../../../resources/Components/Password'

const password = 'thisisagoodpassword123'

describe('creating password', () => {
  let user, getByTestId, queryByTestId, passwordEntryTextArea
  const onCreate = jest.fn()

  beforeEach(() => {
    ;({ user, getByTestId, queryByTestId } = setupComponent(<CreatePassword {...{ password, onCreate }} />))
    passwordEntryTextArea = getByTestId('createPasswordInput')
  })

  it('Should display the correct title when entering the password', () => {
    expect(getByTestId('createPasswordTitle').textContent).toBe('Create Password')
  })

  it('Should not show the `next` button until a valid password is entered', () => {
    expect(queryByTestId('createPasswordButton')).toBeFalsy()
  })

  it('Should debounce password feedback', async () => {
    await user.type(passwordEntryTextArea, 'INVALID')
    expect(queryByTestId('createPasswordErrorMessage')).toBeFalsy()

    act(() => {
      jest.runAllTimers()
    })

    expect(queryByTestId('createPasswordErrorMessage').textContent).toBeTruthy()
  })

  it('Should show an error when the password is too short', async () => {
    await user.type(passwordEntryTextArea, 'INVALID')

    act(() => {
      jest.runAllTimers()
    })

    expect(getByTestId('createPasswordErrorMessage').textContent).toBe(
      'PASSWORD MUST BE AT LEAST 12 CHARACTERS LONG'
    )
  })

  it('Should show the warning when the password is too weak', async () => {
    await user.type(passwordEntryTextArea, 'aaaaaaaaaaaa')

    act(() => {
      jest.runAllTimers()
    })

    expect(getByTestId('createPasswordErrorMessage').textContent).toBe('REPEATS LIKE "AAA" ARE EASY TO GUESS')
  })

  it('Should show the continue button when a valid password is entered', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    expect(queryByTestId('createPasswordErrorMessage')).toBeFalsy()
    expect(getByTestId('createPasswordButton').textContent).toBe('Continue')
  })

  it('Should call the onCreate function when a password is submitted', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(queryByTestId('createPasswordButton'))
    expect(onCreate).toHaveBeenCalledWith(password)
  })
})

describe('confirming password', () => {
  let user, getByTestId, queryByTestId, passwordEntryTextArea
  const onConfirm = jest.fn()

  beforeEach(() => {
    ;({ user, getByTestId, queryByTestId } = setupComponent(<ConfirmPassword {...{ password, onConfirm }} />))
    passwordEntryTextArea = getByTestId('createPasswordInput')
  })

  it('Should show an error when the password does not match previously entered password', async () => {
    await user.type(passwordEntryTextArea, 'DOES_NOT_MATCH')
    expect(queryByTestId('createPasswordErrorMessage')).toBeFalsy()

    act(() => {
      jest.runAllTimers()
    })

    expect(queryByTestId('createPasswordErrorMessage').textContent).toBeTruthy()
  })

  it('Should show the create button when a valid password is entered', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    expect(queryByTestId('createPasswordErrorMessage')).toBeFalsy()
    expect(getByTestId('createPasswordButton').textContent).toBe('create')
  })

  it('Should call the onConfirm function when the password is confirmed', async () => {
    await user.type(passwordEntryTextArea, password)

    act(() => {
      jest.runAllTimers()
    })

    await user.click(queryByTestId('createPasswordButton'))
    expect(onConfirm).toHaveBeenCalledWith(password)
  })
})
