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

  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  } 

  render () {
    const signerType = this.store('main.accounts', this.props.id, 'signer.type')
    const signerKind = (signerType === 'seed' || signerType === 'ring') ? 'hot' : 'device'
    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>{'Verify Address'}</div>  
        <div className='signerVerifyText'>Verify that the address displayed in Frame is correct</div>
        {this.state.verifyAddressResponse ? (
          <div className={this.state.verifyAddressSuccess ? 'signerVerifyResponse signerVerifyResponseSuccess' : 'signerVerifyResponse'}>{this.state.verifyAddressResponse}</div>
        ) : null}
        <div className='quitFrame'>
          <div onMouseDown={() => this.verifyAddress()} className='quitFrameButton'>{signerKind === 'hot' ? 'Verify Address' : 'Verify Address on Device'}</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Verify)
