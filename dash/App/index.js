import { LinkExternal } from '@githubprimer/octicons-react';
import React from 'react'
import Restore from 'react-restore'
import link from '../../resources/link'

// import Main from './Main'
// import Local from './Local'
// import Notify from './Notify'
// import Phase from './Phase'
// import Badge from './Badge'

// import DevTools from 'restore-devtools'
// <DevTools />


class _Signers extends React.Component {
  render () {
    const hardwareSigners = Object.keys(this.store('main.signers')).map(s => {
      const signer = this.store('main.signers', s)
      if (
        signer.type === 'ledger' || 
        signer.type === 'trezor' ||
        signer.type === 'lattice'
      ) {
        return signer
      } else {
        return false
      }
    }).filter(s => s)
    const hotSigners = Object.keys(this.store('main.signers')).map(s => {
      const signer = this.store('main.signers', s)
      if (
        signer.type === 'seed' || 
        signer.type === 'ring'
      ) {
        return signer
      } else {
        return false
      }
    }).filter(s => s)
    return (
      <div className='signers'>
        <div className='signersTop'>
          Accounts & Signers
        </div>
        <div className='signersMid'>
          <div className='newAccount'>
            Add New Account
          </div>
          <div className='addAccounts'>
            <div>Add New...</div>
            <div>Aragon DAO</div>
            <div>Gnosis Safe</div>
            <div>Ledger Wallet</div>
            <div>Trezor Wallet</div>
            <div>Grid+ Lattice1</div>
            <div>Seed Phrase</div>
            <div>Keystore.json</div>
            <div>Non-signing Account</div>
          </div>
          <br/>
          <div>Connected Signers</div>
          <div className='signersHeader'>
            Hardware Signers
          </div>
          <div className='signersList'>
            {hardwareSigners.length ? hardwareSigners.map(signer => {
              return (
                <div className='signer'>
                  <div>{signer.type + ' Signer'}</div>
                  <div>{'type: ' + signer.type}</div>
                  <div>{'status: ' + signer.status}</div>
                  <div>{'accounts: ' + signer.addresses.length}</div>
                  <div>{'Add/remove accounts from this signer'}</div>
                </div>
              )
            }) : (
              <div className='signer'>
                {'No hardware signers'}
              </div>
            )}
          </div>
          <div className='signersHeader'>
            Hot Signers
          </div>
          <div className='signersList'>
            {hotSigners.length ? hotSigners.map(signer => {
              return (
                <div className='signer'>
                  <div className='signerType'>{'Signer Name'}</div>
                  <div className='signerType'>{signer.type + ' Signer'}</div>
                  <div>{'hardware'}</div>
                  <div>{'status: ' + signer.status}</div>
                  <div>{'Add accounts from this signer'}</div>
                </div>
              )
            }) : (
              <div className='signer'>
                {'No hot signers'}
              </div>
            )}
          </div>
        </div>
        <div className='signersBot'>
          Signer Dashboard
        </div>
      </div>
    )
  }
}

const Signers = Restore.connect(_Signers)

class Flow extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.input = React.createRef()
    this.state = {
      input: ''
    }
  }
  // componentDidMount(){
  //   this.input.current.focus()
  // }
  // trigger () {
  //   link.rpc('flowCommand', this.state, (err, sres) => {
  //     console.log(err, res)
  //   })
  // }
  render () {
    return (
      <div className='dash'>
        {this.store('dash.type') === 'signers' ? (
          <Signers />
        ) : this.store('dash.type') === 'networks' ? (
          <div>
            show networks
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Flow)
