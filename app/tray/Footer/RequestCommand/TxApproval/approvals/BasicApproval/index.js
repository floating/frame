import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../../../../resources/svg'

class BasicApproval extends React.Component {
  render() {
    const { approval } = this.props
    return (
      <div className='approveTransactionWarning'>
        <div className='approveTransactionWarningBody'>
          <div className='approveTransactionWarningTitle'>
            <div className='approveTransactionWarningIcon approveTransactionWarningIconLeft'>
              {svg.alert(32)}
            </div>
            {'estimated to fail'}
            <div className='approveTransactionWarningIcon approveTransactionWarningIconRight'>
              {svg.alert(32)}
            </div>
          </div>
          <div className='approveTransactionWarningMessage'>
            {approval && approval.data && approval.data.message}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(BasicApproval)
