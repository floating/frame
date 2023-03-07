import { useEffect, useState } from 'react'
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
    }, 1_500)
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

const Locating = () => (
  <div className='addAccountItemOptionSetupFrame'>
    <div role={'status'} className='addAccountItemOptionTitle' style={{ marginTop: '15px' }}>
      Locating Keystore file...
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

  return (
    <PasswordInput next={next} getError={() => {}} title='Enter Keystore Password' buttonText='Continue' />
  )
}

const LoadKeystore = ({ accountData }) => {
  const { keystore, selecting, secret } = accountData
  const [error, setError] = useState('')
  const addKeystore = () => {
    navForward({ selecting: true })
    setTimeout(() => {
      link.rpc('locateKeystore', (err, locatedKeystore) => {
        link.send('nav:back', 'dash')
        if (err) {
          setError(err)
        } else {
          navForward({ keystore: locatedKeystore })
        }
      })
    }, 640)
  }
  const viewIndex = secret || keystore ? 2 : selecting ? 1 : 0
  const steps = [
    <LocateKeystore key={0} addKeystore={addKeystore} error={error} setError={setError} />,
    <Locating key={1} />,
    <EnterKeystorePassword key={2} keystore={accountData.keystore} />
  ]

  return <>{steps[viewIndex]}</>
}

const AddKeystore = ({ accountData }) => (
  <AddHotAccount
    title='Key Store'
    summary='A keystore account lets you add accounts from your keystore.json file'
    svgName='file'
    intro='Add KeyStore Account'
    createSignerMethod='createFromKeystore'
    newAccountType='keystore'
    backSteps={6}
    accountData={accountData}
    firstStep={<LoadKeystore key={0} accountData={accountData} />}
  />
)

export default AddKeystore
