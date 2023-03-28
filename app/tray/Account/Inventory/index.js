import React from 'react'
import Restore from 'react-restore'

import InventoryPreview from './InventoryPreview'
import InventoryExpanded from './InventoryExpanded'
import InventoryCollection from './InventoryCollection'

class Inventory extends React.Component {
  render() {
    return this.props.expanded ? (
      this.props.expandedData.currentCollection ? (
        <InventoryCollection {...this.props} />
      ) : (
        <InventoryExpanded {...this.props} />
      )
    ) : (
      <InventoryPreview {...this.props} />
    )
  }
}

export default Restore.connect(Inventory)
