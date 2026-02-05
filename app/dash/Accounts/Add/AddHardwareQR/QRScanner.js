import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { URDecoder, UREncoder } from '@ngraveio/bc-ur'
import link from '../../../../../resources/link'

function QRScanner({
  onScan,
  onError,
  onCancel,
  title = 'Scan device sync QR code',
  instructions = 'Open your hardware wallet and display the account sync QR code',
  externalError = null
}) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isAnimated, setIsAnimated] = useState(false)

  const readerRef = useRef(null)
  const urDecoderRef = useRef(null)
  const lastCompletedScanRef = useRef({ payload: '', timestamp: 0 })

  useEffect(() => {
    let mounted = true
    let controls = null

    const startScanning = async () => {
      try {
        // Request camera permission first (required on macOS)
        const permissionResult = await new Promise((resolve) => {
          link.rpc('requestCameraAccess', (err, result) => {
            if (err) {
              resolve({ granted: false, error: err })
            } else {
              resolve(result)
            }
          })
        })

        if (!permissionResult.granted) {
          throw new Error(
            'Camera access denied. Please enable camera access in System Preferences > Privacy & Security > Camera.'
          )
        }

        // Initialize the ZXing reader
        readerRef.current = new BrowserMultiFormatReader()

        // Initialize UR decoder for animated QR codes
        urDecoderRef.current = new URDecoder()

        // Get available cameras
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()

        if (devices.length === 0) {
          throw new Error('No camera found')
        }

        // Start scanning with the first camera
        controls = await readerRef.current.decodeFromVideoDevice(
          devices[0].deviceId,
          videoRef.current,
          (result, _err) => {
            if (!mounted) return

            if (result) {
              handleQRResult(result.getText())
            }
          }
        )
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to access camera')
          onError(err.message || 'Failed to access camera')
        }
      }
    }

    const handleQRResult = (text) => {
      const now = Date.now()
      const lastScan = lastCompletedScanRef.current
      const isDuplicateScan = lastScan.payload === text && now - lastScan.timestamp < 1500
      if (isDuplicateScan) return

      // Check if this is a UR-encoded QR code
      if (text.toLowerCase().startsWith('ur:')) {
        handleURPart(text)
      } else {
        // Non-UR data, pass through directly
        lastCompletedScanRef.current = { payload: text, timestamp: now }
        onScan(text)
        stopScanning()
      }
    }

    const handleURPart = (urPart) => {
      try {
        urDecoderRef.current.receivePart(urPart)

        const progressValue = urDecoderRef.current.getProgress()
        setProgress(Math.round(progressValue * 100))

        // Check if this is an animated QR
        if (urDecoderRef.current.expectedPartCount() > 1) {
          setIsAnimated(true)
        }

        if (urDecoderRef.current.isComplete()) {
          const ur = urDecoderRef.current.resultUR()
          // Re-encode the complete UR to a single-part string (handles multi-frame QRs)
          const encoder = new UREncoder(ur, Infinity)
          const completeURString = encoder.nextPart()

          const now = Date.now()
          const lastScan = lastCompletedScanRef.current
          const isDuplicateScan = lastScan.payload === completeURString && now - lastScan.timestamp < 1500
          if (isDuplicateScan) return

          lastCompletedScanRef.current = { payload: completeURString, timestamp: now }
          onScan(completeURString)
          stopScanning()
        }
      } catch (err) {
        // If this part fails, it might be from a different QR code
        // Reset the decoder and try again
        urDecoderRef.current = new URDecoder()
        setProgress(0)
        setIsAnimated(false)
      }
    }

    const stopScanning = () => {
      if (controls) {
        controls.stop()
      }
      if (readerRef.current) {
        readerRef.current = null
      }
    }

    startScanning()

    return () => {
      mounted = false
      stopScanning()
    }
  }, [onScan, onError])

  const handleCancel = () => {
    if (readerRef.current) {
      readerRef.current = null
    }
    onCancel()
  }

  return (
    <div className='qrScannerContainer'>
      <div className='qrScannerTitle'>{isAnimated ? `Scanning animated QR... ${progress}%` : title}</div>

      <div className='qrScannerVideo'>
        <video ref={videoRef} style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />
      </div>

      {isAnimated && (
        <div className='qrScannerProgress'>
          <div className='qrScannerProgressBar' style={{ width: `${progress}%` }} />
        </div>
      )}

      {(error || externalError) && <div className='qrScannerError'>{error || externalError}</div>}

      <div className='qrScannerInstructions'>{instructions}</div>

      <div className='addAccountItemOptionSubmit' onMouseDown={handleCancel}>
        Cancel
      </div>
    </div>
  )
}

export default QRScanner
