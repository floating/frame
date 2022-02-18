import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../../../../resources/link'
import TxApproval from '.'
import { ApprovalType } from '../../../../../../../../resources/constants'

class TokenSpendApproval extends React.Component {
  constructor (...args) {
    super(...args)

    const props = args[0] || {}

    this.state = {
      amount: props.decimals && new BigNumber(props.amount).shiftedBy(-props.decimals)
    }
  }

  approve () {
    const approvalData = {
      amount: this.state.amount
        ? new BigNumber(this.state.amount).shiftedBy(this.props.decimals)
        : this.props.amount
    }

    link.rpc(
      'confirmRequestApproval', 
      this.props.req, 
      ApprovalType.TokenSpendApproval, 
      approvalData, 
      () => {
        console.log('confirmRequestApproval cb')
      }
    )
  }

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
      amount: this.state.amount,
      token,
      name,
      symbol
    }

    return <TxApproval
      title={'token approval'}
      type={'approveTokenSpend'}
      tokenApproval={tokenApproval}
      req={req}
      updateApprovalAmount={(amount) => {
        this.setState({
          amount:  amount ? new BigNumber(amount) : ''
        })
      }}
      onApprove={() => this.approve()} />
  }
}

export default Restore.connect(TokenSpendApproval)
