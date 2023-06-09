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

  const isFilterMatch = (collection = {}) => {
    if (!collection.meta) return false
    const collectionName = collection.meta.name || ''
    const collectionChain =
      collection.meta.chainId && useStore('main.networks.ethereum', collection.meta.chainId)
    const itemNames = collection.items.map((item) => {
      const { name } = collection.items[item] || {}
      return name
    })
    return matchFilter(collectionFilter, [collectionName, collectionChain.name, ...itemNames])
  }

  let hiddenCount = 0

  const filterCollectionsToDisplay = (collections) => {
    return collections
      .filter((collection = {}) => {
        if (!collection.meta) return false
        const collectionId = `${collection.meta.chainId}:${collection.contract}`
        const isHidden = hiddenCollections.includes(collectionId)
        if (isHidden) hiddenCount++
        return expandedData.hidden ? isHidden : !isHidden
      })
      .sort((a, b) => {
        const assetsLengthA = a.meta.tokens.length
        const assetsLengthB = b.meta.tokens.length
        if (assetsLengthA > assetsLengthB) return -1
        if (assetsLengthA < assetsLengthB) return 1
        return 0
      })
      .filter((c) => isFilterMatch(c))
  }

  const inventory = useStore('main.inventory', account)
  const collections = Object.entries(inventory || {}).map(([contract, collection]) => ({
    ...collection,
    contract
  }))

  const filteredCollections = filterCollectionsToDisplay(collections)

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
              collections={filteredCollections.map((c) => c.contract)}
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
        {!expandedData.hidden ? (
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
                {`+${hiddenCount} Hidden`}
              </div>
            </div>
          </div>
        ) : null}
      </ClusterBox>
    </div>
  )
}

export default InventoryExpanded

// <div className='signerBalanceTotal'>
//   <div className='signerBalanceButtons'>
//     <div
//       className='signerBalanceButton signerBalanceShowAll'
//       onClick={() => {
//         link.send('tray:action', 'collectionVisiblityReset')
//         link.send('nav:back', 'panel')
//       }}
//     >
//       {`Unhide All`}
//     </div>
//   </div>
// </div>
