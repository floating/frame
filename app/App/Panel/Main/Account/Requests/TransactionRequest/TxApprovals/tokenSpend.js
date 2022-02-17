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

    link.rpc('confirmRequestApproval', this.props.req, ApprovalType.TokenSpendApproval, approvalData, () => {})
  }

  render () {
    const {
      req,
      contract
    } = this.props

    // only allow editing of amount if it was provided
    const editValue = (this.state.amount !== undefined) && (
      <div>
        <label for='changeAmount'>
          Change amount to approve
          <input
            id='changeAmount'
            value={this.state.amount}
            onChange={e => this.setState({ amount: e.target.value })}></input>
        </label>
      </div>
    )

    const message = `confirm that you want to allow contract ${contract} to spend tokens`

    return <TxApproval
      title={'approve token spend'}
      message={message}
      req={req}
      editValue={editValue}
      onApprove={() => this.approve()}/>
  }
}

export default Restore.connect(TokenSpendApproval)
