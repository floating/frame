import React from 'react'
import Restore from 'react-restore'

import InventoryPreview from './InventoryPreview'
import InventoryExpanded from './InventoryExpanded'
import InventoryItems from './InventoryItems'

class Inventory extends React.Component {
  render() {
    const onAssetClick = (url) => () => {
      this.store.notify('openExternal', { url })
    }
    const inventory = this.store('main.inventory', this.props.account)

    const expandedData = this.props.expandedData || {}

    return this.props.expanded ? (
      this.props.expandedData.currentCollection ? (
        <InventoryItems
          key={'expandedCollection'}
          {...this.props}
          onAssetClick={onAssetClick}
          expandedData={expandedData}
          inventory={inventory}
          account={this.props.account}
        />
      ) : (
        <InventoryExpanded {...this.props} key={'expandedList'} />
      )
    ) : (
      <InventoryPreview {...this.props} key={'previewList'} />
    )
  }
}

export default Restore.connect(Inventory)
