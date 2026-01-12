import React from 'react'
import Restore from 'react-restore'
import QRCode from 'qrcode'

import link from '../../../../../resources/link'
import QRScanner from '../../../../dash/Accounts/Add/AddHardwareQR/QRScanner'

class QRSignRequest extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      mode: 'display', // 'display' | 'scan'
      qrReady: false,
      error: null,
      urFrames: [],
      currentFrame: 0,
      animationInterval: null,
      currentRequestId: null
    }
    this.canvasRef = React.createRef()

    // Bind callbacks for stable references
    this.handleScan = this.onSignatureScanned.bind(this)
    this.handleError = this.onScanError.bind(this)
    this.handleCancel = this.onScanCancel.bind(this)
  }

  componentDidMount() {
    this.generateQR()
  }

  componentDidUpdate() {
    const signRequest = this.store('main.qr.signRequest')

    if (!signRequest) return

    // If this is a new request, reset state and generate new QR
    if (signRequest.requestId !== this.state.currentRequestId) {
      if (this.state.animationInterval) {
        clearInterval(this.state.animationInterval)
      }
      this.setState(
        {
          mode: 'display',
          qrReady: false,
          error: null,
          urFrames: [],
          currentFrame: 0,
          animationInterval: null,
          currentRequestId: signRequest.requestId
        },
        () => this.generateQR()
      )
    }
  }

  componentWillUnmount() {
    if (this.state.animationInterval) {
      clearInterval(this.state.animationInterval)
    }
  }

  async generateQR() {
    const signRequest = this.store('main.qr.signRequest')
    if (!signRequest) return

    try {
      // Use pre-encoded UR data from the main process
      const qrData = signRequest.urData
      if (!qrData) {
        throw new Error('No UR data in sign request')
      }

      // Handle animated QR codes (multiple frames)
      if (signRequest.animated && signRequest.frames && signRequest.frames.length > 1) {
        // Use callback to ensure state is set before starting animation
        this.setState({ urFrames: signRequest.frames, currentFrame: 0 }, () => {
          this.startAnimation()
        })
      } else {
        // Single QR code
        const canvas = this.canvasRef.current
        if (canvas) {
          await QRCode.toCanvas(canvas, qrData, {
            width: 280,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'L'
          })
          this.setState({ qrReady: true })
        }
      }
    } catch (err) {
      this.setState({ error: err.message || 'Failed to generate QR' })
    }
  }

  startAnimation() {
    const { urFrames } = this.state
    if (!urFrames || urFrames.length === 0) return

    // Animate through frames at ~5 FPS
    const interval = setInterval(async () => {
      const { currentFrame, urFrames } = this.state
      const nextFrame = (currentFrame + 1) % urFrames.length

      const canvas = this.canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, urFrames[nextFrame], {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'L'
        })
      }

      this.setState({ currentFrame: nextFrame, qrReady: true })
    }, 200)

    this.setState({ animationInterval: interval, qrReady: true })

    // Draw first frame immediately
    const canvas = this.canvasRef.current
    if (canvas && urFrames[0]) {
      QRCode.toCanvas(canvas, urFrames[0], {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'L'
      })
    }
  }

  startScanning() {
    if (this.state.animationInterval) {
      clearInterval(this.state.animationInterval)
    }
    this.setState({ mode: 'scan', animationInterval: null })
  }

  returnToDisplay() {
    this.setState({ mode: 'display', qrReady: false }, () => {
      this.generateQR()
    })
  }

  onSignatureScanned(urData) {
    const signRequest = this.store('main.qr.signRequest')
    if (!signRequest) return

    link.rpc('submitQRSignature', signRequest.signerId, urData, (err) => {
      if (err) {
        this.returnToDisplay()
      }
      // On success, the sign request will be cleared from store
    })
  }

  onScanError(_error) {
    this.returnToDisplay()
  }

  onScanCancel() {
    this.returnToDisplay()
  }

  cancel() {
    const signRequest = this.store('main.qr.signRequest')
    if (!signRequest) return

    link.rpc('cancelQRSignRequest', signRequest.signerId, 'User cancelled', () => {})
  }

  render() {
    const signRequest = this.store('main.qr.signRequest')

    if (!signRequest) return null

    const signerName = this.store('main.signers', signRequest.signerId, 'name') || 'QR Device'

    return (
      <div className='qrSignRequestOverlay'>
        <div className='qrSignRequestModal'>
          <div className='qrSignRequestHeader'>
            <div className='qrSignRequestTitle'>Sign with {signerName}</div>
            <div className='qrSignRequestType'>
              {signRequest.type === 'transaction' && 'Transaction'}
              {signRequest.type === 'message' && 'Message'}
              {signRequest.type === 'typedData' && 'Typed Data'}
            </div>
          </div>

          <div className='qrSignRequestContent'>
            {this.state.mode === 'display' ? (
              <>
                <div className='qrSignRequestQR'>
                  <canvas ref={this.canvasRef} style={{ display: this.state.qrReady ? 'block' : 'none' }} />
                  {!this.state.qrReady && !this.state.error && (
                    <div className='qrSignRequestLoading'>Generating QR...</div>
                  )}
                  {this.state.error && <div className='qrSignRequestLoading'>Error: {this.state.error}</div>}
                </div>

                <div className='qrSignRequestInstructions'>
                  <div className='qrSignRequestStep'>1. Scan this QR code with your {signerName}</div>
                  <div className='qrSignRequestStep'>
                    2. Review and approve the transaction on your device
                  </div>
                  <div className='qrSignRequestStep'>
                    3. Click &quot;Scan Signature&quot; and scan the signed QR
                  </div>
                </div>

                <div className='qrSignRequestActions'>
                  <div
                    className='qrSignRequestButton qrSignRequestButtonPrimary'
                    onClick={() => this.startScanning()}
                  >
                    Scan Signature
                  </div>
                  <div
                    className='qrSignRequestButton qrSignRequestButtonSecondary'
                    onClick={() => this.cancel()}
                  >
                    Cancel
                  </div>
                </div>
              </>
            ) : (
              <QRScanner onScan={this.handleScan} onError={this.handleError} onCancel={this.handleCancel} />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(QRSignRequest)
