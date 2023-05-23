import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { matchFilter } from '../../../../../resources/utils'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import CollectionList from '../CollectionList'

class Inventory extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
          height: this.moduleRef.current.clientHeight
        })
      }
    })
  }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  isFilterMatch(collection) {
    const { filter = '' } = this.props
    const c = this.store('main.inventory', this.props.account, collection)
    if (!c) return false
    const collectionName = c.meta && c.meta.name
    const collectionItems = c.items || {}
    const itemNames = Object.keys(collectionItems).map((item) => {
      const { name } = collectionItems[item] || {}
      return name
    })
    return matchFilter(filter, [collectionName, ...itemNames])
  }

  displayCollections() {
    const inventory = this.store('main.inventory', this.props.account)
    const hiddenCollections = this.store('main.hiddenCollections')
    const collections = Object.keys(inventory || {})
    return collections
      .filter((k) => {
        const c = inventory[k]
        if (!c || !c.meta) return false
        const collectionId = `${c.meta.chainId}:${k}`
        const isHidden = hiddenCollections.includes(collectionId)
        return !isHidden
      })
      .sort((a, b) => {
        const assetsLengthA = inventory[a].meta.itemCount
        const assetsLengthB = inventory[b].meta.itemCount
        if (assetsLengthA > assetsLengthB) return -1
        if (assetsLengthA < assetsLengthB) return 1
        return 0
      })
      .filter((c) => this.isFilterMatch(c))
      .slice(0, 5)
  }

  render() {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    const displayCollections = this.displayCollections()
    const moreCollections = collections.length - displayCollections.length
    return (
      <div ref={this.moduleRef} className='balancesBlock' style={{}}>
        <div className='moduleHeader'>
          <span>{svg.inventory(12)}</span>
          <span>{'Inventory'}</span>
        </div>
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
        {collections.length ? (
          <div className='signerBalanceTotal'>
            <div className='signerBalanceButtons'>
              <div
                className='signerBalanceButton signerBalanceShowAll'
                onClick={() => {
                  const crumb = {
                    view: 'expandedModule',
                    data: {
                      id: this.props.moduleId,
                      account: this.props.account
                    }
                  }
                  link.send('nav:forward', 'panel', crumb)
                }}
              >
                {moreCollections > 0 ? `+${moreCollections} More` : 'More'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Inventory)
