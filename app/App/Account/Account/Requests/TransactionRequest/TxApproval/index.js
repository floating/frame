import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../../resources/link'
import { ApprovalType } from '../../../../../../../resources/constants'

import { BasicApproval } from './approvals'

const supportedApprovals = [
  ApprovalType.GasLimitApproval,
  ApprovalType.OtherChainApproval,
  ApprovalType.TokenSpendApproval,
  ApprovalType.TokenSpendRevocation,
]

class TxApproval extends React.Component {
  approve(req, type, data = {}, cb = () => {}) {
    link.rpc('updateRequest', req, type, data, cb)
  }

  decline(req, cb = () => {}) {
    link.rpc('declineRequest', req, cb)
  }

  render() {
    const { req, approval, allowOtherChain } = this.props

    if (!supportedApprovals.includes(approval.type)) {
      throw new Error(`attempted to create unsupported approval: ${JSON.stringify(approval)}`)
    }

    if (approval.type === ApprovalType.GasLimitApproval) {
      return <BasicApproval req={req} approval={approval} onApprove={this.approve} onDecline={this.decline} />
    }

    if (approval.type === ApprovalType.OtherChainApproval) {
      if (!allowOtherChain || typeof allowOtherChain !== 'function')
        throw new Error('OtherChainApproval needs allowOtherChain')
      return (
        <BasicApproval req={req} approval={approval} onApprove={allowOtherChain} onDecline={this.decline} />
      )
    }
  }
}

export default Restore.connect(TxApproval)
