import React from 'react'
import Restore from 'react-restore'
import TxApproval from '.'

class OtherChainApproval extends React.Component {
  constructor (...args) {
    super(...args)
  }

  render () {
    const editValue = (
      <div>
        <label for='changeAmount'>
          Change amount to approve
          <input id='changeAmount'></input>
        </label>
      </div>
    )

    return <TxApproval editValue={editValue} {...this.props} />
  }
}

export default Restore.connect(OtherChainApproval)
