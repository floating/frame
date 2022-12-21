import React from 'react'

import { AddHotAccount } from '../Components'
import { addHexPrefix, isHexString, isValidPrivate } from '@ethereumjs/util'

const isValidSecret = (privateKeyStr) => {
  const prefixed = addHexPrefix(privateKeyStr)
  return isHexString(prefixed) && isValidPrivate(prefixed.slice(2))
}

export default function AddRing({ accountData }) {
  return (
    <AddHotAccount
      {...{
        title: 'Private Key',
        summary: 'A private key account lets you add accounts from individual private keys',
        svgName: 'key',
        intro: 'Add Keyring Account',
        accountData,
        createSignerMethod: 'createFromPrivateKey',
        newAccountType: 'keyring',
        isValidSecret
      }}
    />
  )
}
