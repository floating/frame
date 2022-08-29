import React from 'react'
import Restore from 'react-restore'

import InventoryPreview from './InventoryPreview'
import InventoryExpanded from './InventoryExpanded'

class Inventory extends React.Component {
  render () {
    return (
      this.props.expanded ? (
        <InventoryExpanded {...this.props} />
      ) : (
        <InventoryPreview {...this.props} />
      )
    )
  }
}

export default Restore.connect(Inventory)
