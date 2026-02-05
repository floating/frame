import React from 'react'
import Restore from 'react-restore'
import QRCode from 'qrcode'

import link from '../../../../../resources/link'
import QRScanner from '../../../../dash/Accounts/Add/AddHardwareQR/QRScanner'

class QRSignRequest extends React.Component {
  constructor(...args) {
    super(...args)
    this.isSubmittingSignature = false
    this.state = {
      mode: 'display', // 'display' | 'scan'
      qrReady: false,
      error: null,
      scanError: null,
      scanAttempts: 0,
      submittingSignature: false,
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
          scanError: null,
          scanAttempts: 0,
          submittingSignature: false,
          urFrames: [],
          currentFrame: 0,
          animationInterval: null,
          currentRequestId: signRequest.requestId
        },
        () => {
          this.isSubmittingSignature = false
          this.generateQR()
        }
      )
    }
  }

  componentWillUnmount() {
    if (this.state.animationInterval) {
      clearInterval(this.state.animationInterval)
    }
    this.isSubmittingSignature = false
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
            width: 340,
            margin: 3,
            color: {
              dark: '#000000',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
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

    // Animate through frames at 15 FPS (~67ms interval)
    const interval = setInterval(async () => {
      const { currentFrame, urFrames } = this.state
      const nextFrame = (currentFrame + 1) % urFrames.length

      const canvas = this.canvasRef.current
      if (canvas) {
        await QRCode.toCanvas(canvas, urFrames[nextFrame], {
          width: 340,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        })
      }

      this.setState({ currentFrame: nextFrame, qrReady: true })
    }, 67)

    this.setState({ animationInterval: interval, qrReady: true })

    // Draw first frame immediately
    const canvas = this.canvasRef.current
    if (canvas && urFrames[0]) {
      QRCode.toCanvas(canvas, urFrames[0], {
        width: 340,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
    }
  }

  startScanning() {
    if (this.state.animationInterval) {
      clearInterval(this.state.animationInterval)
    }
    this.setState((prevState) => ({
      mode: 'scan',
      animationInterval: null,
      scanError: null,
      submittingSignature: false,
      scanAttempts: prevState.scanAttempts + 1
    }))
  }

  returnToDisplay() {
    this.setState({ mode: 'display', qrReady: false, scanError: null, submittingSignature: false }, () => {
      this.isSubmittingSignature = false
      this.generateQR()
    })
  }

  formatRpcError(err) {
    if (!err) return 'Unknown signature scan error'

    const rawMessage = typeof err === 'string' ? err : err.message || ''
    if (!rawMessage) {
      return 'Failed to submit scanned signature'
    }

    if (rawMessage.includes('Signature verification failed')) {
      return 'Signature does not match this request. Re-scan the latest request QR and sign again.'
    }

    if (rawMessage.includes('attempts=')) {
      return 'Signature does not match this request. Re-scan the latest request QR and sign again.'
    }

    if (rawMessage.includes('requestId mismatch')) {
      return 'Scanned signature is for a different request. Scan the latest signature QR from your device.'
    }

    if (rawMessage.includes('missing requestId')) {
      return 'Signature QR is missing request metadata. Please sign from the latest request QR.'
    }

    if (rawMessage.includes('Invalid signature')) {
      return 'Signature QR data is invalid. Re-sign on your device and scan again.'
    }

    if (rawMessage.includes('No pending QR sign request')) {
      return 'No active QR signing request. Restart signing from the beginning.'
    }

    if (rawMessage.length > 220) {
      return `${rawMessage.slice(0, 217)}...`
    }

    return rawMessage
  }

  onSignatureScanned(urData) {
    const signRequest = this.store('main.qr.signRequest')
    if (!signRequest || this.isSubmittingSignature || this.state.submittingSignature) return

    this.isSubmittingSignature = true
    this.setState({ submittingSignature: true, scanError: null })
    link.rpc('submitQRSignature', signRequest.signerId, urData, (err) => {
      if (err) {
        this.isSubmittingSignature = false
        this.setState((prevState) => ({
          submittingSignature: false,
          scanError: this.formatRpcError(err),
          scanAttempts: prevState.scanAttempts + 1
        }))
        return
      }

      this.isSubmittingSignature = false
      this.setState({ submittingSignature: false, scanError: null })
    })
  }

  onScanError(_error) {
    this.setState({ scanError: _error || 'Scanner error' })
  }

  onScanCancel() {
    this.isSubmittingSignature = false
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
              <QRScanner
                key={this.state.scanAttempts}
                onScan={this.handleScan}
                onError={this.handleError}
                onCancel={this.handleCancel}
                title='Scan signed QR response'
                instructions='Scan the signature QR shown by your hardware wallet.'
                externalError={this.state.scanError}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(QRSignRequest)
