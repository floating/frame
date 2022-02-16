import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../../../resources/link'
import svg from '../../../../../../../../resources/svg'

class TxApproval extends React.Component {
  constructor (...args) {
    super(...args)

    this.state = {
      inPreview: false
    }
  }

  decline (req) {
    link.rpc('declineRequest', req, () => {})
  }

  render () {
    const { 
      message,
      title,
      req,
      onApprove,
      editValue
    } = this.props

    return (
      <div className='approveTransactionWarning'>
        <div className='approveTransactionWarningOptions'>
          <div
            className='approveTransactionWarningReject'
            onMouseDown={() => this.decline(req)}
          >Reject
          </div>
          <div
            className='approveTransactionWarningPreview'
            onMouseEnter={() => {
              this.setState({ inPreview: true })
            }}
            onMouseMove={() => {
              this.setState({ inPreview: true })
            }}
            onMouseLeave={() => {
              this.setState({ inPreview: false })
            }}
          >
            Preview
          </div>
          <div
            className='approveTransactionWarningProceed'
            onMouseDown={onApprove}
          >Proceed
          </div>
        </div>
        <div className='approveTransactionWarningFill' style={this.state.inPreview ? { opacity: 0 } : { opacity: 1 }}>
          <div className='approveTransactionWarningIcon approveTransactionWarningIconLeft'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningIcon approveTransactionWarningIconRight'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningTitle'>{title}</div>
          <div className='approveTransactionWarningMessage'>
            <div className='approveTransactionWarningMessageInner'>
              {message}
            </div>
            {
              editValue ? React.cloneElement(editValue) : null
            }
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxApproval)
