import React, { useState } from 'react'
import { AnimatedQRCode, AnimatedQRScanner, Purpose } from '@keystonehq/animated-qr'
import ErrorModal from './ErrorModal'
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth'
import { stringify } from 'uuid'

const QRSignModal = ({ showModal, signRequest, submitSignature, cancelRequestSignature }) => {
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState('')

  const ethSignRequest = signRequest && signRequest.request
  const ethSignRequestCbor = ethSignRequest ? ethSignRequest.payload.cbor : null

  const handleSubmitSignature = (signature) => {
    const { request } = signRequest
    const ethSignature = ETHSignature.fromCBOR(Buffer.from(signature.cbor, 'hex'))
    const buffer = ethSignature.getRequestId()
    const signId = stringify(buffer)

    if (signId === request.requestId) {
      submitSignature(signature)
    } else {
      setError('SignIdMismatch')
      setShowScanner(false)
    }
  }

  if (!showModal) {
    return null
  }

  return error ? (
    <ErrorModal
      error={error}
      handleRetry={() => {
        setError('')
        setShowScanner(true)
      }}
      handleCancel={cancelRequestSignature}
    />
  ) : (
    <div className="requestQRModal">
      <div className="requestQR">
        {
          ethSignRequestCbor && !showScanner &&
          <AnimatedQRCode cbor={ethSignRequestCbor} type={'eth-sign-request'}/>
        }
        {
          showScanner && (
            <AnimatedQRScanner
              purpose={Purpose.SIGN}
              handleScan={handleSubmitSignature}
              handleError={() => {
                setError('InvalidQRCode')
              }}
            />
          )
        }
      </div>
      <div className="modalButton">
        <div
          className={`confirm ${showScanner ? 'disabled' : ''}`}
          onMouseDown={() => {
            setShowScanner(true)
          }}
        >
          Get Signature
        </div>
        <div
          className="cancel"
          onMouseDown={cancelRequestSignature}
        >
          Cancel
        </div>
      </div>
    </div>
  )
}

export default QRSignModal
