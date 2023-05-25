import React, { useState } from 'react'
import link from '../../../../../resources/link'

import svg from '../../../../../resources/svg'
import useStore from '../../../../../resources/Hooks/useStore'
import { matchFilter } from '../../../../../resources/utils'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
import CollectionList from '../CollectionList'

const InventoryExpanded = ({ expandedData, moduleId, account }) => {
  const [collectionFilter, setCollectionFilter] = useState('')
  const hiddenCollections = useStore('main.hiddenCollections') || []

  const renderAccountFilter = () => {
    return (
      <div className='panelFilterAccount'>
        <div className='panelFilterIcon'>{svg.search(12)}</div>
        <div className='panelFilterInput'>
          <input
            tabIndex='-1'
            type='text'
            spellCheck='false'
            onChange={(e) => {
              const value = e.target.value
              setCollectionFilter(value)
            }}
            value={collectionFilter}
          />
        </div>
        {collectionFilter ? (
          <div className='panelFilterClear' onClick={() => setCollectionFilter('')}>
            {svg.close(12)}
          </div>
        ) : null}
      </div>
    )
  }

  const isFilterMatch = (collection) => {
    const c = useStore('main.inventory', account, collection)
    if (!c || !c.meta) return false
    const collectionName = c.meta.name || ''
    const collectionItems = c.items || {}
    const collectionChain = c.meta.chainId && useStore('main.networks.ethereum', c.meta.chainId)
    const itemNames = Object.keys(collectionItems).map((item) => {
      const { name } = collectionItems[item] || {}
      return name
    })
    return matchFilter(collectionFilter, [collectionName, collectionChain.name, ...itemNames])
  }

  const displayCollections = () => {
    const inventory = useStore('main.inventory', account)
    const collections = Object.keys(inventory || {})
    return collections
      .filter((k) => {
        const c = useStore('main.inventory', account, k)
        if (!c || !c.meta) return false
        const collectionId = `${c.meta.chainId}:${k}`
        const isHidden = hiddenCollections.includes(collectionId)
        return expandedData.hidden ? isHidden : !isHidden
      })
      .sort((a, b) => {
        const assetsLengthA = Object.keys(inventory[a].items).length
        const assetsLengthB = Object.keys(inventory[b].items).length
        if (assetsLengthA > assetsLengthB) return -1
        if (assetsLengthA < assetsLengthB) return 1
        return 0
      })
      .filter((c) => isFilterMatch(c))
  }

  const inventory = useStore('main.inventory', account)
  const collections = Object.keys(inventory || {})
  return (
    <div className='accountViewScroll'>
      {renderAccountFilter()}
      <ClusterBox>
        <Cluster>
          {collections.length ? (
            <CollectionList
              expandedData={expandedData}
              moduleId={moduleId}
              account={account}
              collections={displayCollections()}
            />
          ) : inventory ? (
            <ClusterRow>
              <ClusterValue>
                <div className='inventoryNotFound'>No Items Found</div>
              </ClusterValue>
            </ClusterRow>
          ) : (
            <ClusterRow>
              <ClusterValue>
                {/* <div className='signerBalanceLoading'>{svg.sine()}</div> */}
                <div className='inventoryNotFound'>Loading Items</div>
              </ClusterValue>
            </ClusterRow>
          )}
        </Cluster>
        {!expandedData.hidden && (
          <div className='signerBalanceTotal'>
            <div className='signerBalanceButtons'>
              <div
                className='signerBalanceButton signerBalanceShowAll'
                onClick={() => {
                  const crumb = {
                    view: 'expandedModule',
                    data: {
                      id: moduleId,
                      title: 'Hidden Inventory',
                      account: account,
                      hidden: true
                    }
                  }
                  link.send('nav:forward', 'panel', crumb)
                }}
              >
                {`+${hiddenCollections.length} Hidden`}
              </div>
            </div>
          </div>
        )}
      </ClusterBox>
    </div>
  )
}

export default InventoryExpanded
