import { AddHotAccount } from '../Components'
import { utils } from 'ethers'

const validateMnemonic = (mnemonic) => {
  if (!utils.isValidMnemonic(mnemonic)) return 'INVALID SEED PHRASE'
  if (mnemonic.split(' ').length < 12) return 'SEED PHRASE TOO SHORT'
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
        validateSecret: validateMnemonic
      }}
    />
  )
}
