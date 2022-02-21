import React from 'react'
import Restore from 'react-restore'

import { ApprovalType } from '../../../../../../../../resources/constants'

import { OtherChain, GasLimit, TokenSpend } from './approvals'

class TxApproval extends React.Component {
  render () {
    const { req, approval, allowOtherChain } = this.props

    if (approval) {
      if (approval.type === ApprovalType.OtherChainApproval) {
        return (
          <OtherChain
            req={req}
            allowOtherChain={allowOtherChain}
          />
        )
      }
  
      if (approval.type === ApprovalType.GasLimitApproval) {
        return (
          <GasLimit
            req={req}
            approval={approval}
          />
        )
      }
  
      if (approval.type === ApprovalType.TokenSpendApproval) {
        return (
          <TokenSpend 
            req={req}
            approval={approval}
          />
        )
      }
    }

    return null
  }
}

export default Restore.connect(TxApproval)
