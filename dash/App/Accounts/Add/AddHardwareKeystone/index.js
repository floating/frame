import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { AnimatedQRScanner, Purpose } from "@keystonehq/animated-qr"

class AddHardwareKeystone extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      step: 'prepare',
      errorMessage: '',
      isCameraReady: false,
    }
  }

  handleScan(ur) {
    link.rpc('createKeystone', ur, () => {})
    this.props.close()
  }

  handleError() {
    const errorMessage = "Please check your QR Code"
    this.setState({errorMessage, step: 'prepare'})
  }

  componentDidMount () {
    link.rpc('askCameraPermission', (access) => {
      if(access) {
        this.setState({isCameraReady: true})
      } else {
        const errorMessage = "Please allow us to access your camera"
        this.setState({errorMessage})
      }
    })
  }

  render () {
    return (
      <div className='addAccountItem addAccountItemSmart addAccountItemAdding'>
        <div className='addAccountItemBar' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <div className='addAccountItemIconType addAccountItemIconHardware'>{svg.keystone(24)}</div>
              </div>
              <div className='addAccountItemTopTitle'>Keystone</div>
            </div>
            <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'Done'}</div>
            <div className='addAccountItemSummary'>Keystone</div>
          </div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionSetup'>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  {
                    this.state.step === 'prepare' && (
                      <div className='syncContainer'>
                        <ul className='syncTips'>
                          <li>Upgrade Keystone to the latest firmware</li>
                          <li>Select [MetaMask / Defi / Web3] mode</li>
                          <li>Display sync QR code</li>
                        </ul>
                        {
                          this.state.errorMessage &&
                          <div className='syncError'>{this.state.errorMessage}</div>
                        }
                        <div
                          className='addAccountItemOptionSubmit'
                          onMouseDown={() => {
                            this.setState({step: 'sync'})
                          }}
                        >{
                          this.state.errorMessage ? "Retry" : "Next"
                        }
                        </div>
                      </div>
                    )
                  }
                  {
                    this.state.step === 'sync' && (
                      <div className='syncContainer'>
                        <div>Scan QR Code</div>
                        <div className='qrReaderCamera'>
                          {
                            this.state.isCameraReady && (
                              <AnimatedQRScanner
                                purpose={Purpose.SYNC}
                                handleScan={(data) => this.handleScan(data)}
                                handleError={(error) => this.handleError(error)}
                              />)
                          }
                        </div>
                        <div className='syncTips'>
                          Place the QR code in front of your camera. The screen is blurred, but it will not affect the reading.
                        </div>
                      </div>
                    )
                  }
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

export default Restore.connect(AddHardwareKeystone)
