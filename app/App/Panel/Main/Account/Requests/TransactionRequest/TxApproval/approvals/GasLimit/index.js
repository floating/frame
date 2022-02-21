import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../../../../../resources/link'
import svg from '../../../../../../../../../../resources/svg'

class GasLimit extends React.Component {
  constructor (...args) {
    super(...args)

    this.state = {
      inPreview: false
    }
  }

  approve () {
    link.rpc('confirmRequestApproval', this.props.req, this.props.approval.type, () => {})
  }

  decline () {
    link.rpc('declineRequest', this.props.req, () => {})
  }

  render () {
    const { approval } = this.props
    return (
      <div className='approveTransactionWarning'>
        <div className='approveTransactionWarningOptions'>
          <div
            className='approveTransactionWarningReject'
            onClick={() => this.decline()}
          >
            Reject
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
            onClick={() => this.approve()}
          >
            Proceed
          </div>
        </div>
        <div 
          className='approveTransactionWarningFill'
          style={this.state.inPreview ? { opacity: 0 } : { opacity: 1 }}
        >
          <div className='approveTransactionWarningIcon approveTransactionWarningIconLeft'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningIcon approveTransactionWarningIconRight'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningTitle'>
            {'estimated to fail'}
          </div>
          <div className='approveTransactionWarningMessage'>
            <div className='approveTransactionWarningMessageInner'>
              {approval && approval.data && approval.data.message}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(GasLimit)
