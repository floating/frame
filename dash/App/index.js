import React from 'react'
import Restore from 'react-restore'

import Signer from './Signer'

import AddHardware from './Add/AddHardware'
import AddHardwareLattice from './Add/AddHardwareLattice'
import AddAragon from './Add/AddAragon'
import AddPhrase from './Add/AddPhrase'
import AddRing from './Add/AddRing'
import AddKeystore from './Add/AddKeystore'
import AddAddress from './Add/AddAddress'

class AddAccounts extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      view: 'default'
    }
  }
  renderAddNonsigning () {
    return (
      <div className='addAccounts cardShow'>
       <AddAddress close={this.props.close} />          
      </div>
    )
  }
  renderAddKeyring () {
    return (
      <div className='addAccounts cardShow'>
        <AddRing close={this.props.close} />
      </div>
    )
  }
  renderAddKeystore () {
    return (
      <div className='addAccounts cardShow'>
        <AddKeystore close={this.props.close} />
      </div>
    )
  }
  renderAddSeed () {
    return (
      <div className='addAccounts cardShow'>
       <AddPhrase close={this.props.close} />
      </div>
    )
  }
  renderAddTrezor () {
    return (
      <div className='addAccounts cardShow'>
       <AddHardware type={'trezor'} close={this.props.close} />
      </div>
    )
  }
  renderAddLedger () {
    return (
      <div className='addAccounts cardShow'>
       <AddHardware type={'ledger'} close={this.props.close} />
      </div>
    )
  }
  renderAddLattice () {
    return (
      <div className='addAccounts cardShow'>
       <AddHardwareLattice type={'lattice'} close={this.props.close} />
      </div>
    )
  }
  renderAddGnosis () {
    return (
      <div className='addAccounts cardShow'>
       {'Add Gnosis'}
      </div>
    )
  }
  renderAddAragon () {
    return (
      <div className='addAccounts cardShow'>
       <AddAragon close={this.props.close} />
      </div>
    )
  }
  renderDefault () {
    return (
      <div className='addAccounts cardShow'>
        <div className='addAccountsHeader'>
          <div className='addAccountsHeaderTitle'>What type of account would you like to add?</div>
          <div className='addAccountsHeaderClose' onClick={() => this.props.close()}>{'done'}</div>
        </div>
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'lattice' })}>GridPlus Lattice1</div>
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'ledger' })}>Ledger Device</div>
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'trezor' })}>Trezor Device</div>
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'aragon' })}>Aragon DAO</div>
        {/* <div className='accountTypeSelect' onClick={() => this.setState({ view: 'gnosis' })}>Gnosis Safe</div> */}
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'seed' })}>Seed Phrase</div>
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'keyring' })}>Private Key</div>
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'keystore' })}>Keystore File (json)</div>
        <div className='accountTypeSelect' onClick={() => this.setState({ view: 'nonsigning' })}>Watch-only Account</div>
      </div>
    )
  }
  render () {
    const view = this.state.view
    if (view === 'default') {
      return this.renderDefault()
    } else if (view === 'aragon')  {
      return this.renderAddAragon()
    // } else if (view === 'gnosis')  {
    //   return this.renderAddGnosis()
    } else if (view === 'ledger')  {
      return this.renderAddLedger()
    } else if (view === 'trezor')  {
      return this.renderAddTrezor()
    } else if (view === 'lattice')  {
      return this.renderAddLattice()
    } else if (view === 'seed')  {
      return this.renderAddSeed()
    } else if (view === 'keyring')  {
      return this.renderAddKeyring()
    } else if (view === 'keystore')  {
      return this.renderAddKeystore()
    } else if (view === 'nonsigning')  {
      return this.renderAddNonsigning()
    } else {
      return 'Cannot find ' + view
    }
  }
}

class Dash extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.input = React.createRef()
    this.state = {
      showAddAccounts: false
    }
  }
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

      console.log({ hardwareSigners, hotSigners })
      
      return (
      <div className='dash'>
        {this.state.showAddAccounts ? <AddAccounts close={() => this.setState({ showAddAccounts: false })} /> : null}
        <div className='newAccount' onClick={() => this.setState({ showAddAccounts: !this.state.showAddAccounts })}>
          <div className='newAccountIcon'>{'+'}</div> 
          Add New Account
        </div>
        <div className='signers'>
          <div className='signersMid'>
            <div className='signersHeader'>
              Your Hardware Signers
            </div>
            <div className='signersList'>
              {hardwareSigners.length ? (
                hardwareSigners
                  .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                  .map((signer, index) => <Signer index={index} key={signer.id} {...signer} />)
              ) : (
                <div className='noSigners'>
                  {'No hardware signers detected'}
                </div>
              )}
            </div>
            <div className='signersHeader'>
              Your Hot Signers
            </div>
            <div className='signersList'>
              {hotSigners.length ? (
                hotSigners.map((signer, index) => <Signer index={index} key={signer.id} {...signer} />)
              ) : (
                <div className='noSigners'>
                  {'No hot signers detected'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dash)
