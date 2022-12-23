import React from 'react'

import { AddHotAccount } from '../Components'
import { utils } from 'ethers'

const isValidMnemonic = (mnemonic) => {
  if (!utils.isValidMnemonic) return false
  return mnemonic.split(' ').length > 11
}

export default function AddPhrase({ accountData }) {
  return (
    <AddHotAccount
      {...{
        title: 'Seed Phrase',
        summary: 'A phrase account uses a list of words to backup and restore your account',
        svgName: 'seedling',
        intro: 'Add Phrase Account',
        accountData,
        createSignerMethod: 'createFromPhrase',
        newAccountType: 'seed',
        isValidSecret: isValidMnemonic
      }}
    />
  )
}
