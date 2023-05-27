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
  box-shadow: 0px 1px 2px var(--ghostY);
  z-index: 10;
  img {
    margin: -1px;
    object-fit: cover;
    position: relative;
    z-index: 10;
  }
  canvas {
    opacity: 0;
  }
`

const MissingDot = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: var(--outerspace);
  z-index: 1;
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

const Collection = ({ moduleId, account, collection, collectionId }) => {
  const scanning = false
  const chain = useStore('main.networks.ethereum', collection.meta.chainId)
  const chainColor = useStore('main.networksMeta.ethereum', collection.meta.chainId, 'primaryColor')

  const [active, setActive] = useState(false)

  const previewItems = Object.keys(collection.items || {})
    .sort((a, b) => {
      a = collection.items[a].tokenId
      b = collection.items[b].tokenId
      return a < b ? -1 : b > a ? 1 : 0
    })
    .slice(0, 8)

  useEffect(() => {
    const items = previewItems.map((tokenId) => ({
      contract: collectionId,
      chainId: collection.meta.chainId,
      tokenId
    }))
    link.rpc('subscribeToItems', account, items, () => {})
  }, [])

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
                img={collection.meta.image.cdn.frozen.thumb}
                alt={collection.meta.name}
                color={chainColor ? `var(--${chainColor})` : ''}
                nft={true}
                active={active}
              />
            </CollectionIcon>
            <CollectionMain>
              <CollectionDots style={{ width: previewItems.length * 22 + 4 + 'px' }}>
                {previewItems.map((id, i) => {
                  const item = collection.items[id]
                  return (
                    <CollectionDot style={{ animationDelay: i * 0.1 + 's' }} active={active}>
                      <img src={item.img} alt={item.name} />
                      <MissingDot />
                    </CollectionDot>
                  )
                })}
              </CollectionDots>
              <CollectionLine />
              <CollectionCount>{Object.keys(collection.items).length}</CollectionCount>
            </CollectionMain>
            <div className='signerBalanceChain'>
              <span style={{ color: chainColor ? `var(--${chainColor})` : '' }}>{chain.name}</span>
              <span>{collection.meta.name}</span>
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
    return <Collection moduleId={moduleId} account={account} collection={collection} collectionId={k} />
  })
}

export default CollectionList
