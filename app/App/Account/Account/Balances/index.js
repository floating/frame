/* globals ResizeObserver */

import React from 'react'
import Restore from 'react-restore'

import BalancesPreview from './BalancesPreview'
import BalancesExpanded from './BalancesExpanded'

class Balances extends React.Component {
  render () {
    return (
      this.props.expanded ? (
        <BalancesExpanded {...this.props} />
      ) : (
        <BalancesPreview {...this.props} />
      )
    )
  }
}

export default Restore.connect(Balances)
