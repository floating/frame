import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class Verify extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })

    this.state = {
      expand: false,
      verifyAddressSuccess: false,
      verifyAddressResponse: '',
      verifyInProgress: false
    }
  }

  verifyAddress () {
    this.setState({ verifyInProgress: true })

    link.rpc('verifyAddress', err => {
      if (err) {
        this.setState({ verifyInProgress: false, verifyAddressSuccess: false, verifyAddressResponse: err })
      } else {
        this.setState({ verifyInProgress: false, verifyAddressSuccess: true, verifyAddressResponse: 'Address matched!' })
      }

      setTimeout(() => {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: '' })
      }, 5 * 1000)
    })
  }

  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  } 

  render () {
    const signerType = this.store('main.accounts', this.props.id, 'lastSignerType')
    const isHwSigner = (signerType === 'seed' || signerType === 'ring')
    const account = this.store('main.accounts', this.props.id)

    const buttonClasses = ['moduleButton']

    if (this.state.verifyInProgress) {
      buttonClasses.push('signerVerifyInProgress')
    }

    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        {account.smart ? (
          <>
            <div className='moduleHeader'>{'Smart Account'}</div>  
            <div className='moduleMain moduleMainSettings'>
              <div>{account.smart.type} Account</div>
              <div>DAO exists on this chain: ?</div>
              <div>Agent Address: {account.address}</div>
              <div>Acting Account: {account.smart.actor}</div>
              <div>DAO Address: {account.smart.dao}</div>
              <div>IPFS Gateway: {'https://ipfs.aragon.org'}</div>
            </div>
          </>
        ) : (
          <>
            <div className='moduleHeader'>{'Verify Address'}</div>  
            <div className='moduleMain'>
              <div className='signerVerifyText'>Verify that the address displayed in Frame is correct</div>
              {this.state.verifyAddressResponse ? (
                <div className={this.state.verifyAddressSuccess ? 'signerVerifyResponse signerVerifyResponseSuccess cardShow' : 'signerVerifyResponse'}>{this.state.verifyAddressResponse}</div>
              ) : null}
              <div className={buttonClasses.join(' ')} onMouseDown={() => {
                if (!this.state.verifyInProgress) {
                  this.verifyAddress()
                }
              }}>
                {
                  this.state.verifyInProgress
                    ? isHwSigner ? 'Verifying' : 'check your device'
                    : isHwSigner ? 'Verify Address' : 'Verify Address on Device'
                }
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
}

export default Restore.connect(Verify)
