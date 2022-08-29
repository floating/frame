import React from 'react'
import Restore from 'react-restore'

class Inventory extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      hoverAsset: false
    }
  }

  displayCollections () {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    return collections.filter(k => {
      return true
    }).sort((a, b) => {
      const assetsLengthA = Object.keys(inventory[a].items).length
      const assetsLengthB = Object.keys(inventory[b].items).length
      if (assetsLengthA > assetsLengthB) return -1
      if (assetsLengthA < assetsLengthB) return 1
      return 0
    }).slice(0, this.props.expanded ? this.length : 6)
  }

  renderInventoryList () {
    const inventory = this.store('main.inventory', this.props.account)
    const displayCollections = this.displayCollections()
    return (
      displayCollections.map(k => {
        return (
          <div 
            key={k}
            className='inventoryCollection'
            onClick={() => {
              this.props.expandModule({ id: this.props.moduleId, account: this.props.account, currentCollection: k })
            }}
          >
            <div className='inventoryCollectionTop'>
              <div className='inventoryCollectionName'>{inventory[k].meta.name}</div>
              <div className='inventoryCollectionCount'>{Object.keys(inventory[k].items).length}</div>
              <div className='inventoryCollectionLine' />
            </div>
          </div>
        )
      })
    )
  }

  render () {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    return (
      <div className=''>
        <div className='inventoryWrapper'>
          {collections.length ? (
            this.renderInventoryList()
          ) : inventory ? (
            <div className='inventoryNotFound'>No Items Found</div>
          ) : (
            <div className='inventoryNotFound'>Loading Items..</div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Inventory)
