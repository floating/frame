import React, { useState, useEffect } from 'react'

import link from '../../../../../resources/link'
import RingIcon from '../../../../../resources/Components/RingIcon'
import useStore from '../../../../../resources/Hooks/useStore'
import { ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
import RingIcon from '../../../../../resources/Components/RingIcon'
import useStore from '../../../../../resources/Hooks/useStore'

import {
  CollectionInner,
  CollectionIcon,
  CollectionMain,
  CollectionLine,
  CollectionDot,
  CollectionDots,
  CollectionCount
} from './styled'

const displayName = (name = '') => {
  if (name.length > 24) {
    return name.slice(0, 22) + '..'
  }
  return name
}

const displayChain = (name = '') => {
  if (name.length > 14) {
    return name.slice(0, 12) + '..'
  }
  return name
}

const Collection = ({ moduleId, account, collection, collectionId }) => {
  const scanning = false
  const chain = useStore('main.networks.ethereum', collection.meta.chainId)
  const chainColor = useStore('main.networksMeta.ethereum', collection.meta.chainId, 'primaryColor')

  const [active, setActive] = useState(false)

  const previewItems = collection.items
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

  const frozenSrc = collection?.meta?.media?.cdn?.frozenThumb || ''
  const src = collection?.meta?.media?.cdn?.thumb || ''

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
        <div className={'signerBalance'} onMouseDown={() => this.setState({ selected: i })}>
          {scanning && <div className='signerBalanceLoading' style={{ animationDelay: 0.15 * i + 's' }} />}
          <CollectionInner>
            <CollectionIcon>
              <RingIcon
                img={src}
                imgFrozen={frozenSrc}
                alt={collection.meta.name}
                color={chainColor ? `var(--${chainColor})` : ''}
                nft={true}
                active={active}
              />
            </CollectionIcon>
            <CollectionMain>
              <CollectionDots style={{ width: previewItems.length * 24 + 'px' }}>
                {previewItems.map((item, i) => {
                  const src = item.media?.cdn?.frozenThumb || ''
                  return (
                    <CollectionDot key={item.tokenId} active={active}>
                      {src ? <img src={src} alt={item.name} /> : null}
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

const CollectionList = ({ moduleId, account, collections: collectionContracts = [] }) => {
  const inventory = useStore('main.inventory', account)
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
