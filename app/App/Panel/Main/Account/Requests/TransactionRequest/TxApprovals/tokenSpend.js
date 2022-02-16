import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../../../resources/link'
import TxApproval from '.'
import { ApprovalType } from '../../../../../../../../resources/constants'

class TokenSpendApproval extends React.Component {
  constructor (...args) {
    super(...args)

    const props = args[0] || {}

    this.state = {
      amount: props.amount
    }
  }

  approve () {
    link.rpc('confirmRequestApproval', this.props.req, ApprovalType.TokenSpendApproval, () => {})
  }

  render () {
    const editValue = (
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

    // TODO: create message from contract data
    const message = `confirm that you want to allow <contract> to spend tokens`

    return <TxApproval
      title={'approve token spend'}
      message={message}
      req={this.props.req}
      editValue={editValue}
      onApprove={() => this.approve() }/>
  }
}

export default Restore.connect(TokenSpendApproval)
