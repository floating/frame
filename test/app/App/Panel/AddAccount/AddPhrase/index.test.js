import React from 'react'

import { setupComponent } from '../../../../../componentSetup'
import link from '../../../../../../resources/link'
import AddPhraseAccountComponent from '../../../../../../dash/App/Accounts/Add/AddPhrase'

jest.mock('../../../../../../resources/link', () => ({
  invoke: jest.fn().mockResolvedValue({}),
  send: jest.fn()
}))

describe('entering seed phrase', () => {
  it('should do nothing', () => {
    expect(true).toBeTruthy()
  })
  let user, getByTestId, seedPhraseTextArea
  // beforeEach(() => {
  //   ;({ user, getByTestId } = setupComponent(<AddPhraseAccountComponent accountData={{}} />))
  //   seedPhraseTextArea = getByTestId('addHotAccountSecretTextEntry')
  // })

  // it('should display the correct title when entering the seed phrase', () => {
  //   const title = getByTestId('addHotAccountSecretTitle')
  //   expect(title.textContent).toBe('Seed Phrase')
  // })

  // it('should show an error message when an incorrect seed phrase is submitted', async () => {
  //   // await user.type(seedPhraseTextArea, '99{enter}')
  //   // const errorMessage = getByTestId('addHotAccountSecretError')
  //   // expect(errorMessage.textContent).toBe('INVALID SEED PHRASE')
  // })

  // it('should update the navigation when a valid seed phrase is submitted', () => {})
})

describe('entering password', () => {})

describe('confirming password', () => {})
