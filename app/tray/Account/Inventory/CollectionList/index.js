import React, { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'

import link from '../../../../../resources/link'
import RingIcon from '../../../../../resources/Components/RingIcon'
import useStore from '../../../../../resources/Hooks/useStore'
import { ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
import RingIcon from '../../../../../resources/Components/RingIcon'
import useStore from '../../../../../resources/Hooks/useStore'

const CollectionInner = styled.div`
  position: relative;
  height: 65px;
  transition: all linear 0.8s;
`

const CollectionIcon = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
`

const CollectionMain = styled.div`
  position: absolute;
  display: flex;
  justify-content: space-between;
  align-items: center;
  inset: 30px 20px 12px 66px;
`

const CollectionLine = styled.div`
  background: var(--ghostY);
  height: 1px;
  margin: 0px 12px 0px 6px;
  flex: 1;
  position: relative;
`

const wave = keyframes`
  0% { 
    transform: translate(0, 0);
  }
  50% {
    transform: translate(1px, 2px);
  }
  100% { 
    transform: translate(0, 0);
  }
`

const CollectionDot = styled.div`
  display: flex;
  height: 16px;
  width: 16px;
  min-height: 16px;
  min-width: 16px;
  margin-right: 6px;
  border-radius: 4px;
  transition: var(--standard);
  overflow: hidden;
  justify-content: center;
  position: relative;
  font-family: 'FiraCode';
  font-size: 10px;
  border: 1px solid var(--ghostB);
  background: var(--ghostB);
  box-shadow: 0px 1px 2px var(--ghostY);
  z-index: 10;
  img {
    margin: -1px;
    object-fit: cover;
    position: relative;
    z-index: 10;
  }
  img:before {
    content: attr(alt);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    background: var(--ghostB);
    color: var(--outerspace);
    color: transparent;
  }
`

const CollectionDots = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  transition: var(--standardFast);
`

const CollectionCount = styled.div`
  display: flex;
  height: 20px;
  min-height: 20px;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-family: 'FiraCode';
  padding-left: 4px;
`

const displayName = (name = '') => {
  if (name.length > 19) {
    return name.slice(0, 25) + '...'
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

  const frozenSrc = collection?.meta?.image?.cdn?.frozen?.thumb || ''
  const src = collection?.meta?.image?.cdn?.original?.thumb || ''

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
              currentCollection: collectionId
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
                  const src = item.image?.cdn?.frozen?.thumb || ''
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
              <span style={{ color: chainColor ? `var(--${chainColor})` : '' }}>{chain.name}</span>
              <span>{displayName(collection.meta.name)}</span>
            </div>
          </CollectionInner>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}

const CollectionList = ({ moduleId, account, collections = [] }) => {
  const inventory = useStore('main.inventory', account)
  return collections.map((k) => {
    const collection = inventory[k]
    return (
      <Collection key={k} moduleId={moduleId} account={account} collection={collection} collectionId={k} />
    )
  })
}

export default CollectionList
