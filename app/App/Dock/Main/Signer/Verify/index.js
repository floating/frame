import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'

class Verify extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      verifyAddressSuccess: false,
      verifyAddressResponse: ''
    }
  }

  verifyAddress () {
    link.rpc('verifyAddress', (err, res) => {
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
    const signerType = this.store('main.accounts', this.props.id, 'signer.type')
    const signerKind = (signerType === 'seed' || signerType === 'ring') ? 'hot' : 'device'
    return (
      <div className='signerSlide'>
        <div className='signerSettingsTitle'>Verify Address</div>
        <div className='signerPermission'>
          <div className='signerVerifyText'>Verify that the address displayed in Frame is correct</div>
          {this.state.verifyAddressResponse ? (
            <div className={this.state.verifyAddressSuccess ? 'signerVerifyResponse signerVerifyResponseSuccess' : 'signerVerifyResponse'}>{this.state.verifyAddressResponse}</div>
          ) : null}
        </div>
        <div className='quitFrame'>
          <div onMouseDown={() => this.verifyAddress()} className='quitFrameButton'>{signerKind === 'hot' ? 'Verify Address' : 'Verify Address on Device'}</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Verify)
