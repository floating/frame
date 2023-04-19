import React from 'react'
import Restore from 'react-restore'

import InventoryPreview from './InventoryPreview'
import InventoryExpanded from './InventoryExpanded'
import InventoryCollection from './InventoryCollection'

class Inventory extends React.Component {
  render() {
    const onAssetClick = (url) => () => {
      this.store.notify('openExternal', { url })
    }
    const inventory = this.store('main.inventory', this.props.account)
    const expandedData = this.props.expandedData || {}

    return this.props.expanded ? (
      this.props.expandedData.currentCollection ? (
        <InventoryCollection
          {...this.props}
          onAssetClick={onAssetClick}
          expandedData={expandedData}
          inventory={inventory}
          account={this.props.account}
        />
      ) : (
        <InventoryExpanded {...this.props} />
      )
    ) : (
      <InventoryPreview {...this.props} />
    )
  }
}

export default Restore.connect(Inventory)
