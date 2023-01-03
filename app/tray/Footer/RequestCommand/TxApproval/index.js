import React from 'react'
import Restore from 'react-restore'

import { ApprovalType } from '../../../../../resources/constants'
import { BasicApproval } from './approvals'

class TxApproval extends React.Component {
  render() {
    const { req, approval } = this.props
    if (approval.type === ApprovalType.GasLimitApproval) {
      return <BasicApproval req={req} approval={approval} />
    } else {
      throw new Error(`attempted to create unsupported approval: ${JSON.stringify(approval)}`)
    }
  }
}

export default Restore.connect(TxApproval)
