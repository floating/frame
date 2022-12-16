import React from 'react'

import { AddHotAccount } from '../Components'
import { BigNumber } from 'ethers'
import { addHexPrefix, isHexString } from '@ethereumjs/util'

const orderOfSecp256k1 = '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'

const isValidSecret = (privateKeyStr) => {
  const formatted = addHexPrefix(privateKeyStr)
  return isHexString(formatted) && BigNumber.from(formatted).lt(orderOfSecp256k1)
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
