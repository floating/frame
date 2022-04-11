import React from 'react'

const ErrorModal = ({ error, handleRetry, handleCancel }) => (
  <div className="errorModal">
    <div className="errorMessage">
      {
        error === 'SignIdMismatch'
          ? (
            <>
              <div>Incongruent transaction data.</div>
              <div>Please check the transaction details.</div>
            </>
          )
          : <div>Error: We couldn't identify that QR code</div>
      }
    </div>
    <div className="modalButton">
      <div
        className="confirm"
        onMouseDown={handleRetry}
      >
        Retry
      </div>
      <div
        className="cancel"
        onMouseDown={handleCancel}
      >
        Cancel
      </div>
    </div>
  </div>
)

export default ErrorModal