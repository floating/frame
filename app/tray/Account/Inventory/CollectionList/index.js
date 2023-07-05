import React, { useState, useEffect } from 'react'

import link from '../../../../../resources/link'
import RingIcon from '../../../../../resources/Components/RingIcon'
import useStore from '../../../../../resources/Hooks/useStore'
import { ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import DisplayMedia from '../../../../../resources/Components/DisplayMedia'
import {
  CollectionInner,
  CollectionIcon,
  CollectionMain,
  CollectionLine,
  CollectionDot,
  CollectionDots,
  CollectionCount,
  CollectionDotLoading
} from './styled'

const displayName = (name = '') => {
  if (name.length > 26) {
    return name.slice(0, 24).trim() + '..'
  }
  return name
}

const displayChain = (name = '') => {
  if (name.length > 12) {
    return name.slice(0, 10).trim() + '..'
  }
  return name
}

const Collection = ({ moduleId, account, collection, collectionId }) => {
  const scanning = false
  const chain = useStore('main.networks.ethereum', collection.meta.chainId)
  const chainColor = useStore('main.networksMeta.ethereum', collection.meta.chainId, 'primaryColor')

  const [active, setActive] = useState(false)

  const previewItems = collection.meta.tokens
    .map((tokenId) => {
      const item = collection.items.find((item) => item.tokenId === tokenId)
      return item || { tokenId }
    })
    .slice()
    .sort((x, y) => {
      const a = x.tokenId
      const b = y.tokenId
      return a < b ? -1 : b > a ? 1 : 0
    })
    .slice(0, 8)

  useEffect(() => {
    const items = collection.meta.tokens.map((tokenId) => ({
      contract: collectionId,
      chainId: collection.meta.chainId,
      tokenId
    }))
    link.rpc('subscribeToItems', account, items, () => {})
  }, [])

  const media = collection?.meta?.media

  return (
    <ClusterRow key={collectionId}>
      <ClusterValue
        onMouseOver={() => {
          setActive(true)
        }}
        onMouseLeave={() => {
          setActive(false)
        }}
        onClick={() => {
          const crumb = {
            view: 'expandedModule',
            data: {
              id: moduleId,
              account: account,
              currentCollection: collectionId,
              title: 'Inventory Items'
            }
          }
          link.send('nav:forward', 'panel', crumb)
        }}
      >
        <div className='signerBalance'>
          {scanning && <div className='signerBalanceLoading' style={{ animationDelay: 0.15 * i + 's' }} />}
          <CollectionInner>
            <CollectionIcon>
              <RingIcon
                alt={collection.meta.name}
                media={media}
                color={chainColor ? `var(--${chainColor})` : ''}
                thumb={true}
                frozen={!active}
                nft={true}
              />
            </CollectionIcon>
            <CollectionMain>
              <CollectionDots style={{ width: previewItems.length * 24 + 'px' }}>
                {previewItems.map((item, i) => {
                  return (
                    <CollectionDot key={item.tokenId}>
                      {item.media ? (
                        <DisplayMedia media={item.media} thumb={true} frozen={true} />
                      ) : (
                        <CollectionDotLoading
                          style={{
                            animationDelay: 140 * i + 'ms',
                            background: chainColor ? `var(--${chainColor})` : 'var(--outerspace)'
                          }}
                        />
                      )}
                    </CollectionDot>
                  )
                })}
              </CollectionDots>
              <CollectionLine />
              <CollectionCount>{Object.keys(collection.meta.tokens).length}</CollectionCount>
            </CollectionMain>
            <div className='signerBalanceChain'>
              <span style={{ color: chainColor ? `var(--${chainColor})` : '' }}>
                {displayChain(chain.name)}
              </span>
              <span>{displayName(collection.meta.name)}</span>
            </div>
          </CollectionInner>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}

const CollectionList = ({ moduleId, account, collections: collectionContracts = [], inventory }) => {
  return collectionContracts.map((contractAddress) => {
    const collection = inventory[contractAddress]
    return (
      <Collection
        key={contractAddress}
        moduleId={moduleId}
        account={account}
        collection={collection}
        collectionId={contractAddress}
      />
    )
  })
}

export default CollectionList
