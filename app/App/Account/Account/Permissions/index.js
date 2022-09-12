import React from 'react'
import Restore from 'react-restore'

import DappPreview from './DappPreview'
import DappExpanded from './DappExpanded'

class Dapp extends React.Component {
  render () {
    return (
      this.props.expanded ? (
        <DappExpanded {...this.props} />
      ) : (
        <DappPreview {...this.props} />
      )
    )
  }
}

export default Restore.connect(Dapp)