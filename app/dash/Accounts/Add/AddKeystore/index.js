import React from 'react'
import { AddHotAccount } from '../Components'
import link from '../../../../../resources/link'
import { PasswordInput } from '../../../../../resources/Components/Password'

const navForward = (accountData) =>
  link.send('nav:forward', 'dash', {
    view: 'accounts',
    data: {
      showAddAccounts: true,
      newAccountType: 'keystore',
      accountData
    }
  })

const LocateKeystore = ({ addKeystore }) => (
  <div className='addAccountItemOptionSetupFrame'>
    <div
      className='addAccountItemOptionSubmit'
      style={{ marginTop: '10px' }}
      onMouseDown={() => addKeystore()}
    >
      Locate Keystore File (json)
    </div>
  </div>
)

const Loading = () => (
  <div className='addAccountItemOptionSetupFrame'>
    <div className='addAccountItemOptionTitle' style={{ marginTop: '15px' }}>
      Locating Keystore file
    </div>
  </div>
)

const EnterKeystorePassword = ({ keystore }) => {
  const next = (keystorePassword) =>
    navForward({
      secret: keystore,
      creationArgs: [keystorePassword]
    })
  //TODO: validate keystore password here?
  const getError = () => {}
  const title = 'Enter Keystore Password'
  const buttonText = 'Continue'
  return <PasswordInput {...{ next, getError, title, buttonText, debounceTime: 750 }} />
}
const KeystoreError = ({ keystoreError }) => (
  <div className='addAccountItemOptionSetupFrame'>
    <>
      <div className='addAccountItemOptionTitle'>{keystoreError}</div>
      <div
        role='button'
        className='addAccountItemOptionSubmit'
        onClick={() => link.send('nav:back', 'dash', 2)}
      >
        back
      </div>
    </>
  </div>
)

const LoadKeystore = ({ accountData }) => {
  const { keystoreError, keystore } = accountData

  const addKeystore = () => {
    navForward({ keystore: 'SELECTING' })
    setTimeout(() => {
      link.rpc('locateKeystore', (err, locatedKeystore) => {
        if (err) {
          navForward({ keystoreError: err })
        } else {
          link.send('nav:back', 'dash')
          navForward({ keystore: locatedKeystore })
        }
      })
    }, 640)
  }

  const viewIndex = keystoreError ? 3 : keystore ? (keystore !== 'SELECTING' ? 2 : 1) : 0

  const steps = [
    <LocateKeystore key={0} {...{ addKeystore }} />,
    <Loading key={1} />,
    <EnterKeystorePassword key={2} keystore={accountData.keystore} />,
    <KeystoreError keystoreError={keystoreError} />
  ]
  return <>{steps[viewIndex]}</>
}

export default function AddKeystore({ accountData }) {
  return (
    <AddHotAccount
      {...{
        title: 'Key Store',
        summary: 'A keystore account lets you add accounts from your keystore.json file',
        svgName: 'file',
        intro: 'Add KeyStore Account',
        accountData,
        createSignerMethod: 'createFromKeystore',
        firstStep: <LoadKeystore key={0} accountData={accountData} />,
        newAccountType: 'keystore',
        validateSecret: () => {}
      }}
    />
  )
}
