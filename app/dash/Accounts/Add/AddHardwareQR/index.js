import React from 'react'
import Restore from 'react-restore'

import Signer from '../../../Signer'
import link from '../../../../../resources/link'
import RingIcon from '../../../../../resources/Components/RingIcon'
import QRScanner from './QRScanner'

class AddHardwareQR extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      adding: false,
      index: 0,
      status: '',
      error: false,
      deviceName: 'Keystone',
      scanning: false,
      scannedData: '',
      signerId: null
    }
    this.forms = [React.createRef()]
  }

  onChange(key, e) {
    e.preventDefault()
    const value = e.target.value.substring(0, 20)
    this.setState({ [key]: value || '' })
  }

  onBlur(key, e) {
    e.preventDefault()
    this.setState({ [key]: this.state[key] || '' })
  }

  onFocus(key, e) {
    e.preventDefault()
    if (this.state[key] === '') {
      this.setState({ [key]: '' })
    }
  }

  currentForm() {
    return this.forms[this.state.index]
  }

  blurActive() {
    const formInput = this.currentForm()
    if (formInput && formInput.current) formInput.current.blur()
  }

  focusActive() {
    setTimeout(() => {
      const formInput = this.currentForm()
      if (formInput && formInput.current) formInput.current.focus()
    }, 500)
  }

  next() {
    this.blurActive()
    this.setState({ index: this.state.index + 1 })
    this.focusActive()
  }

  startScanning() {
    this.setState({ scanning: true, index: 1 })
  }

  onQRScanned(data) {
    this.setState({ scannedData: data, scanning: false, status: 'Importing device...' })
    this.importDevice(data)
  }

  onScanError(error) {
    this.setState({ scanning: false, status: error, error: true })
  }

  onScanCancel() {
    this.setState({ scanning: false, index: 0 })
  }

  importDevice(urData) {
    link.rpc('importQRDevice', urData, this.state.deviceName, (err, result) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else {
        this.setState({
          signerId: result.id,
          status: 'Successful',
          index: 2
        })
        // Navigate to the new signer
        link.send('tray:action', 'backDash', 2)
        const crumb = {
          view: 'expandedSigner',
          data: { signer: result.id }
        }
        link.send('tray:action', 'navDash', crumb)
      }
    })
  }

  restart() {
    this.setState({
      adding: false,
      index: 0,
      scannedData: '',
      scanning: false,
      signerId: null
    })
    setTimeout(() => {
      this.setState({ status: '', error: false })
    }, 500)
    this.focusActive()
  }

  render() {
    let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'

    let signer
    if (this.state.signerId && this.state.status === 'Successful') {
      signer = this.store('main.signers', this.state.signerId)
    }

    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index) / 4 + 's' }}>
        <div className='addAccountItemBar' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <div className='addAccountItemIconType addAccountItemIconHardware'>
                  <RingIcon svgName={'qr'} svgSize={20} />
                </div>
              </div>
              <div className='addAccountItemTopTitle'>QR Hardware</div>
            </div>
            <div className='addAccountItemSummary'>Keystone, Keycard Shell</div>
          </div>
          <div className='addAccountItemOption'>
            <div
              className='addAccountItemOptionSetup'
              style={{ transform: `translateX(-${100 * this.state.index}%)` }}
            >
              <div className='addAccountItemOptionSetupFrames'>
                {/* Frame 0: Device Name */}
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Device Name</div>
                  <div className='addAccountItemOptionInput'>
                    <input
                      tabIndex='-1'
                      ref={this.forms[0]}
                      value={this.state.deviceName}
                      onChange={(e) => this.onChange('deviceName', e)}
                      onFocus={(e) => this.onFocus('deviceName', e)}
                      onBlur={(e) => this.onBlur('deviceName', e)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          this.startScanning()
                        }
                      }}
                    />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.startScanning()}>
                    Scan QR Code
                  </div>
                </div>

                {/* Frame 1: QR Scanner */}
                <div className='addAccountItemOptionSetupFrame'>
                  {this.state.scanning ? (
                    <QRScanner
                      onScan={(data) => this.onQRScanned(data)}
                      onError={(err) => this.onScanError(err)}
                      onCancel={() => this.onScanCancel()}
                    />
                  ) : (
                    <>
                      <div className='addAccountItemOptionTitle'>{this.state.status || 'Scanning...'}</div>
                      {this.state.error ? (
                        <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>
                          Try Again
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                {/* Frame 2: Success */}
                <div className='addAccountItemOptionSetupFrame'>
                  {signer && this.state.status === 'Successful' ? (
                    <Signer key={signer.id} {...signer} inSetup={true} />
                  ) : (
                    <>
                      <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                      {this.state.error ? (
                        <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>
                          Try Again
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className='addAccountItemFooter' />
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddHardwareQR)
