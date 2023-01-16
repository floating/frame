import React, { useEffect, useState } from 'react'
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

const LocateKeystore = ({ addKeystore, error, setError }) => {
  useEffect(() => {
    if (!error) return
    setTimeout(() => {
      setError('')
    }, 3_500)
  }, [error])
  return (
    <div className='addAccountItemOptionSetupFrame'>
      {error ? (
        <div role='button' className='addAccountItemOptionError'>
          {error}
        </div>
      ) : (
        <div
          role='button'
          className='addAccountItemOptionSubmit'
          style={{ marginTop: '10px' }}
          onClick={() => addKeystore()}
        >
          Locate Keystore File (json)
        </div>
      )}
    </div>
  )
}

const Loading = () => (
  <div className='addAccountItemOptionSetupFrame'>
    <div role={'status'} className='addAccountItemOptionTitle' style={{ marginTop: '15px' }}>
      Locating Keystore file
    </div>
  </div>
)

const EnterKeystorePassword = ({ keystore }) => {
  const next = (keystorePassword) => {
    navForward({
      secret: keystore,
      creationArgs: [keystorePassword]
    })
  }
  //TODO: validate keystore password here?
  const getError = () => {}
  const title = 'Enter Keystore Password'
  const buttonText = 'Continue'
  return <PasswordInput {...{ next, getError, title, buttonText }} />
}

const LoadKeystore = ({ accountData }) => {
  const { keystore } = accountData

  const [error, setError] = useState('')
  const [selecting, setSelecting] = useState(false)

  const addKeystore = () => {
    setSelecting(true)
    setTimeout(() => {
      link.rpc('locateKeystore', (err, locatedKeystore) => {
        setSelecting(false)
        if (err) {
          setError(err)
        } else {
          navForward({ keystore: locatedKeystore })
        }
      })
    }, 640)
  }

  const viewIndex = keystore ? 2 : selecting ? 1 : 0

  const steps = [
    <LocateKeystore key={0} {...{ addKeystore, error, setError }} />,
    <Loading key={1} />,
    <EnterKeystorePassword key={2} keystore={accountData.keystore} />
  ]
  return <>{steps[viewIndex]}</>
}

const AddKeystore = ({ accountData }) => (
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

export default AddKeystore
