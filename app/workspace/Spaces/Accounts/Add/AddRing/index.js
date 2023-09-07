import { AddHotAccount } from '../Components'
import { addHexPrefix, isHexString, isValidPrivate } from '@ethereumjs/util'

const validatePrivateKey = (privateKeyStr) => {
  const prefixed = addHexPrefix(privateKeyStr)
  if (!isHexString(prefixed) || !isValidPrivate(prefixed.slice(2))) {
    return 'INVALID PRIVATE KEY'
  }
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
        validateSecret: validatePrivateKey
      }}
    />
  )
}
