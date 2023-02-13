import React from 'react'
import Restore from 'react-restore'

import link from '../../../resources/link'
import svg from '../../../resources/svg'

import Signer from '../Signer'

import AddHardware from './Add/AddHardware'
import AddHardwareLattice from './Add/AddHardwareLattice'
import AddPhrase from './Add/AddPhrase'
import AddRing from './Add/AddRing'
import AddKeystore from './Add/AddKeystore'
import AddAddress from './Add/AddAddress'

class AddAccounts extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      view: 'default'
    }
  }
  renderAddNonsigning() {
    return (
      <div className='addAccounts cardShow'>
        <AddAddress close={this.props.close} />
      </div>
    )
  }
  renderAddKeyring({ accountData }) {
    return (
      <div className='addAccounts cardShow'>
        <AddRing close={this.props.close} accountData={accountData} />
      </div>
    )
  }
  renderAddKeystore({ accountData }) {
    return (
      <div className='addAccounts cardShow'>
        <AddKeystore close={this.props.close} accountData={accountData} />
      </div>
    )
  }
  renderAddSeed({ accountData }) {
    return (
      <div className='addAccounts cardShow'>
        <AddPhrase close={this.props.close} accountData={accountData} />
      </div>
    )
  }
  renderAddTrezor() {
    return (
      <div className='addAccounts cardShow'>
        <AddHardware type={'trezor'} close={this.props.close} />
      </div>
    )
  }
  renderAddLedger() {
    return (
      <div className='addAccounts cardShow'>
        <AddHardware type={'ledger'} close={this.props.close} />
      </div>
    )
  }
  renderAddLattice() {
    return (
      <div className='addAccounts cardShow'>
        <AddHardwareLattice type={'lattice'} close={this.props.close} />
      </div>
    )
  }
  renderAddGnosis() {
    return <div className='addAccounts cardShow'>{'Add Gnosis'}</div>
  }
  createNewAccount(type) {
    link.send('tray:action', 'navDash', {
      view: 'accounts',
      data: { showAddAccounts: true, newAccountType: type }
    })
  }
  renderDefault() {
    return (
      <div className='addAccounts cardShow'>
        <div className='addAccountsHeader'>
          <div className='addAccountsHeaderTitle'>What type of account would you like to add?</div>
          {/* <div className='addAccountsHeaderClose' onClick={() => this.props.close()}>{'done'}</div> */}
        </div>
        <div className='accountTypeSelect' onClick={() => this.createNewAccount('lattice')}>
          <div className='accountTypeSelectIcon'>{svg.lattice(24)}</div>
          <div>{'GridPlus Lattice1'}</div>
        </div>
        <div className='accountTypeSelect' onClick={() => this.createNewAccount('ledger')}>
          <div className='accountTypeSelectIcon'>{svg.ledger(22)}</div>
          <div>{'Ledger Device'}</div>
        </div>
        <div className='accountTypeSelect' onClick={() => this.createNewAccount('trezor')}>
          <div className='accountTypeSelectIcon'>{svg.trezor(20)}</div>
          <div>{'Trezor Device'}</div>
        </div>
        <div className='accountTypeSelect' onClick={() => this.createNewAccount('seed')}>
          <div className='accountTypeSelectIcon'>{svg.seedling(25)}</div>
          <div>{'Seed Phrase'}</div>
        </div>
        <div className='accountTypeSelect' onClick={() => this.createNewAccount('keyring')}>
          <div className='accountTypeSelectIcon'>{svg.key(23)}</div>
          <div>{'Private Key'}</div>
        </div>
        <div className='accountTypeSelect' onClick={() => this.createNewAccount('keystore')}>
          <div className='accountTypeSelectIcon'>{svg.file(22)}</div>
          <div>{'Keystore File (json)'}</div>
        </div>
        <div className='accountTypeSelect' onClick={() => this.createNewAccount('nonsigning')}>
          <div className='accountTypeSelectIcon'>{svg.mask(26)}</div>
          <div>{'Watch Account'}</div>
        </div>
      </div>
    )
  }
  render() {
    const { newAccountType, accountData = {} } = this.props.data

    if (newAccountType === 'ledger') {
      return this.renderAddLedger()
    } else if (newAccountType === 'trezor') {
      return this.renderAddTrezor()
    } else if (newAccountType === 'lattice') {
      return this.renderAddLattice()
    } else if (newAccountType === 'seed') {
      return this.renderAddSeed({ accountData })
    } else if (newAccountType === 'keyring') {
      return this.renderAddKeyring({ accountData })
    } else if (newAccountType === 'keystore') {
      return this.renderAddKeystore({ accountData })
    } else if (newAccountType === 'nonsigning') {
      return this.renderAddNonsigning()
    } else {
      return this.renderDefault()
    }
  }
}

class Dash extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.input = React.createRef()
    this.state = {
      showAddAccounts: false
    }
  }
  render() {
    const hardwareSigners = Object.keys(this.store('main.signers'))
      .map((s) => {
        const signer = this.store('main.signers', s)
        if (signer.type === 'ledger' || signer.type === 'trezor' || signer.type === 'lattice') {
          return signer
        } else {
          return false
        }
      })
      .filter((s) => s)
    const hotSigners = Object.keys(this.store('main.signers'))
      .map((s) => {
        const signer = this.store('main.signers', s)
        if (signer.type === 'seed' || signer.type === 'ring') {
          return signer
        } else {
          return false
        }
      })
      .filter((s) => s)

    const { showAddAccounts } = this.props.data
    return showAddAccounts ? (
      <AddAccounts
        close={() =>
          link.send('tray:action', 'navDash', { view: 'accounts', data: { showAddAccounts: false } })
        }
        {...this.props}
      />
    ) : (
      <div className='cardShow'>
        <div className='signers'>
          <div className='signersMid'>
            {/* <div className='signersHeader'>
                Your Hardware Signers
              </div> */}
            <div className='signersList'>
              {hardwareSigners.length
                ? hardwareSigners
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                    .map((signer, index) => <Signer index={index} key={signer.id} {...signer} />)
                : null}
            </div>
            {/* <div className='signersHeader'>
                Your Hot Signers
              </div> */}
            <div className='signersList'>
              {hotSigners.length
                ? hotSigners.map((signer, index) => <Signer index={index} key={signer.id} {...signer} />)
                : null}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dash)
