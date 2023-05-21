import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
import CollectionList from '../CollectionList'

class Inventory extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      hoverAsset: false
    }
  }

  displayCollections() {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    return collections
      .sort((a, b) => {
        const assetsLengthA = Object.keys(inventory[a].items).length
        const assetsLengthB = Object.keys(inventory[b].items).length
        if (assetsLengthA > assetsLengthB) return -1
        if (assetsLengthA < assetsLengthB) return 1
        return 0
      })
      .slice(0, this.props.expanded ? this.length : 6)
  }

  renderInventoryList() {
    const inventory = this.store('main.inventory', this.props.account)
    const displayCollections = this.displayCollections()
    return displayCollections.map((k) => {
      const {
        meta: { name, itemCount }
      } = inventory[k]
      return (
        <ClusterRow key={k}>
          <ClusterValue
            onClick={() => {
              const crumb = {
                view: 'expandedModule',
                data: {
                  id: this.props.moduleId,
                  account: this.props.account,
                  currentCollection: k
                }
              }
              link.send('nav:forward', 'panel', crumb)
            }}
          >
            <div key={k} className='inventoryCollection'>
              <div className='inventoryCollectionTop'>
                <div className='inventoryCollectionName'>{name || k}</div>
                <div className='inventoryCollectionCount'>{itemCount}</div>
                <div className='inventoryCollectionLine' />
              </div>
            </div>
          </ClusterValue>
        </ClusterRow>
      )
    })
  }

  render() {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    return (
      <div className='accountViewScroll'>
        <ClusterBox style={{ marginTop: '20px' }}>
          <Cluster>
            {collections.length ? (
              <CollectionList {...this.props} collections={this.displayCollections()} />
            ) : inventory ? (
              <ClusterRow>
                <ClusterValue>
                  <div className='inventoryNotFound'>No Items Found</div>
                </ClusterValue>
              </ClusterRow>
            ) : (
              <ClusterRow>
                <ClusterValue>
                  <div className='inventoryNotFound'>Loading Items..</div>
                </ClusterValue>
              </ClusterRow>
            )}
          </Cluster>
        </ClusterBox>
      </div>
    )
  }
}

export default Restore.connect(Inventory)
