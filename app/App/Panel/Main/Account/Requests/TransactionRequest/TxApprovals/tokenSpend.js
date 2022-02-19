import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../../../../resources/link'
import TxApproval from '.'
import { ApprovalType } from '../../../../../../../../resources/constants'

class TokenSpendApproval extends React.Component {

  render () {
    const {
      req,
      contract,
      name,
      symbol
    } = this.props

    const token = this.store('main.tokens.known')

    const tokenApproval = {
      contract,
      token,
      name,
      symbol,
      decimals: this.props.decimals,
      requestedAmount: this.props.amount
    }

    return <TxApproval
      title={'token approval'}
      type={'approveTokenSpend'}
      tokenApproval={tokenApproval}
      req={req}
    />
  }
}

export default Restore.connect(TokenSpendApproval)
