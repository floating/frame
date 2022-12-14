import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'

class Verify extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
          height: this.moduleRef.current.clientHeight
        })
      }
    })

    this.state = {
      expand: false,
      verifyAddressSuccess: false,
      verifyAddressResponse: '',
      verifyInProgress: false
    }
  }

  verifyAddress() {
    this.setState({ verifyInProgress: true })

    link.rpc('verifyAddress', (err) => {
      if (err) {
        this.setState({ verifyInProgress: false, verifyAddressSuccess: false, verifyAddressResponse: err })
      } else {
        this.setState({
          verifyInProgress: false,
          verifyAddressSuccess: true,
          verifyAddressResponse: 'Address matched!'
        })
      }

      setTimeout(() => {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: '' })
      }, 5 * 1000)
    })
  }

  getText(signerType) {
    const isHwSigner = signerType === 'seed' || signerType === 'ring'

    if (this.state.verifyInProgress) {
      return isHwSigner ? 'verifying' : 'check your device'
    }

    return isHwSigner ? 'verify address' : 'verify address on device'
  }

  componentDidMount() {
    this.resizeObserver.observe(this.moduleRef.current)
  }

  render() {
    const signerType = this.store('main.accounts', this.props.id, 'lastSignerType')
    const account = this.store('main.accounts', this.props.id)
    const buttonClasses = ['moduleButton']

    if (this.state.verifyInProgress) {
      buttonClasses.push('signerVerifyInProgress')
    }

    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>{'Verify Address'}</div>
        <div className='moduleMain'>
          <div className='signerVerifyText'>Verify that the address displayed in Frame is correct</div>
          {this.state.verifyAddressResponse ? (
            <div
              className={
                this.state.verifyAddressSuccess
                  ? 'signerVerifyResponse signerVerifyResponseSuccess cardShow'
                  : 'signerVerifyResponse'
              }
            >
              {this.state.verifyAddressResponse}
            </div>
          ) : null}
          <div
            className={buttonClasses.join(' ')}
            onMouseDown={(evt) => {
              if (evt.button === 0 && !this.state.verifyInProgress) {
                this.verifyAddress()
              }
            }}
          >
            {this.getText(signerType)}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Verify)
