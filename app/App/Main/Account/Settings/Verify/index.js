import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class Verify extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expand: false,
      verifyAddressSuccess: false,
      verifyAddressResponse: ''
    }
  }

  verifyAddress () {
    link.rpc('verifyAddress', err => {
      if (err) {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: err })
      } else {
        this.setState({ verifyAddressSuccess: true, verifyAddressResponse: 'Address matched!' })
      }
      setTimeout(() => {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: '' })
      }, 5000)
    })
  }

  render () {
    const signerType = this.store('main.accounts', this.props.id, 'lastSignerType')
    const signerKind = (signerType === 'seed' || signerType === 'ring') ? 'hot' : 'device'
    const account = this.store('main.accounts', this.props.id)
    // if (signerType === 'Address') return null
    return (
      <div>
        {account.smart ? (
          <>
            <div>{account.smart.type} Account</div>
            <div>DAO exists on this chain: ?</div>
            <div>Agent Address: {account.address}</div>
            <div>Acting Account: {account.smart.actor}</div>
            <div>DAO Address: {account.smart.dao}</div>
            <div>IPFS Gateway: {'https://ipfs.aragon.org'}</div>
          </>
        ) : (
          <>
            <div>Verify the address displayed in Frame is correct</div>
            <div className='settingsButton' onMouseDown={() => this.verifyAddress()}>
              {signerKind === 'hot' ? 'Verify Address' : 'Verify Address on Device'}
            </div>
            {this.state.verifyAddressResponse ? (
              <div className={this.state.verifyAddressSuccess ? 'signerVerifyResponse signerVerifyResponseSuccess cardShow' : 'signerVerifyResponse cardShow'}>
                {this.state.verifyAddressResponse}
              </div>
            ) : null}
          </>
        )}
      </div>
    )
  }
}

export default Restore.connect(Verify)
