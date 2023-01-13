import React, { useState } from 'react'
import { AddHotAccount } from '../Components'
import link from '../../../../../resources/link'

// class AddRing extends React.Component {
//   constructor(...args) {
//     super(...args)
//     this.state = {
//       index: 0,
//       adding: false,
//       password: '',
//       status: '',
//       error: false,
//       mode: this.props.mode ? this.props.mode : 'manual',
//       keystore: '',
//       keystorePassword: ''
//     }
//     this.forms = {
//       keystorePassword: React.createRef(),
//       keystoreCreatePassword: React.createRef()
//     }
//   }

//   onChange(key, e) {
//     e.preventDefault()
//     const update = {}
//     update[key] = e.target.value || ''
//     this.setState(update)
//   }

//   onBlur(key, e) {
//     e.preventDefault()
//     const update = {}
//     update[key] = this.state[key] || ''
//     this.setState(update)
//   }

//   onFocus(key, e) {
//     e.preventDefault()
//     if (this.state[key] === '') {
//       const update = {}
//       update[key] = ''
//       this.setState(update)
//     }
//   }

//   next() {
//     this.blurActive()
//     this.setState({ index: ++this.state.index })
//     this.focusActive()
//   }

// addKeystore() {
//   this.setState({ mode: 'keystore' })
//   this.next()
//   setTimeout(() => {
//     link.rpc('locateKeystore', (err, keystore) => {
//       if (err) {
//         this.setState({ keystore: '', error: err })
//       } else {
//         this.setState({ keystore })
//         this.next()
//       }
//     })
//   }, 640)
// }

//   restart() {
//     this.setState({
//       index: 1,
//       adding: false,
//       password: '',
//       mode: 'manual',
//       privateKey: '',
//       keystore: '',
//       keystorePassword: ''
//     })
//     setTimeout(() => {
//       this.setState({ status: '', error: false })
//     }, 500)
//     this.focusActive()
//   }

//   keyPress(e, next) {
//     if (e.key === 'Enter') {
//       e.preventDefault()
//       next()
//     }
//   }

//   adding() {
//     this.setState({ adding: true })
//   }

//   blurActive() {
//     const formInput = this.currentForm()
//     if (formInput) formInput.current.blur()
//   }

//   focusActive() {
//     setTimeout(() => {
//       const formInput = this.currentForm()
//       if (formInput) formInput.current.focus()
//     }, 500)
//   }

//   currentForm() {
//     let current
//     if (this.state.index === 2) current = this.forms.keystorePassword
//     if (this.state.index === 3) current = this.forms.keystoreCreatePassword
//     return current
//   }

//   render() {
//     let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'
//     return (
//       <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index) / 4 + 's' }}>
//         <div className='addAccountItemBar addAccountItemHot' />
//         <div className='addAccountItemWrap'>
//           <div className='addAccountItemTop'>
//             <div className='addAccountItemTopType'>
//               <div className='addAccountItemIcon'>
//                 <div className='addAccountItemIconType addAccountItemIconHot'>
//                   <RingIcon svgName={'file'} />
//                 </div>
//                 <div className='addAccountItemIconHex addAccountItemIconHexHot' />
//               </div>
//               <div className='addAccountItemTopTitle'>Keystore</div>
//             </div>
//             {/* <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'Done'}</div> */}
//             <div className='addAccountItemSummary'>
//               A keystore account lets you add accounts from your keystore.json file
//             </div>
//           </div>
//           <div className='addAccountItemOption'>
//             <div
//               className='addAccountItemOptionIntro'
//               onMouseDown={() => {
//                 this.adding()
//                 setTimeout(() => {
//                   link.send('tray:action', 'navDash', {
//                     view: 'notify',
//                     data: { notify: 'hotAccountWarning', notifyData: {} }
//                   })
//                 }, 800)
//               }}
//             >
//               Add Keyring Account
//             </div>
//             <div
//               className='addAccountItemOptionSetup'
//               style={{ transform: `translateX(-${100 * this.state.index}%)` }}
//             ></div>
//           </div>
//           <div className='addAccountItemFooter' />
//         </div>
//       </div>
//     )
//   }
// }

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
    <div className='addAccountItemOptionTitle'>Locating Keystore</div>
  </div>
)

const SetPassword = ({ nextStep }) => {
  const [keystorePassword, setKeystorePassword] = useState('')
  return (
    <div className='addAccountItemOptionSetupFrame'>
      <div className='addAccountItemOptionTitle'>Enter Keystore Password</div>
      <div className='addAccountItemOptionInput'>
        <input
          type='password'
          tabIndex='-1'
          // ref={this.forms.keystorePassword}
          value={keystorePassword}
          onChange={(e) => setKeystorePassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && nextStep(keystorePassword)}
        />
      </div>
      {/* <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>
      Next
    </div> */}
    </div>
  )
}

const LoadKeystore = () => {
  const [keystore, setKeystore] = useState('')
  const [error, setError] = useState('')
  const addKeystore = () => {
    setKeystore('SELECTING')
    setTimeout(() => {
      link.rpc('locateKeystore', (err, locatedKeystore) => {
        if (err) {
          setError(err)
        } else {
          console.log(locatedKeystore)
          setKeystore(locatedKeystore)
        }
      })
    }, 640)
  }

  const nextStep = (keystorePassword) => {
    link.send('nav:forward', 'dash', {
      view: 'accounts',
      data: {
        showAddAccounts: true,
        newAccountType: 'keystore',
        accountData: {
          secret: keystore,
          keystorePassword
        }
      }
    })
  }

  const viewIndex = error ? 3 : keystore ? (keystore !== 'SELECTING' ? 2 : 1) : 0

  const steps = [
    <LocateKeystore key={0} {...{ addKeystore }} />,
    <Loading key={1} />,
    <SetPassword key={2} {...{ nextStep }} />,
    <div key={3} className='addAccountItemOptionSetupFrame'>
      {error}
    </div>
  ]
  return <div className='addAccountItemOptionSetupFrames'>{steps[viewIndex]}</div>
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
        additionalCreationArgs: [accountData.keystorePassword],
        firstStep: <LoadKeystore key={0} />,
        newAccountType: 'keystore',
        validateSecret: () => {}
      }}
    />
  )
}
