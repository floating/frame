import React, { useState, useEffect } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import {
  ClusterBox,
  ClusterScroll,
  Cluster,
  ClusterRow,
  ClusterValue
} from '../../../../../resources/Components/Cluster'

import styled, { keyframes } from 'styled-components'

const pylonProxy = 'https://static.pylon.link'

const pulsate = keyframes`
  0% { transform: scale(1) }
  100% { transform: scale(3) }
`
const PulsateCircle = styled.div`
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--ghostZ);
  animation: ${pulsate} 1.4s ease-in-out infinite alternate;
  animation-delay: ${(props) => (props.index || 0) * 0.3 + 's'};
  transform: translate3d(0, 0, 1px);
`

const InventoryPreview = styled.div`
  position: absolute !important;
  top: 42px;
  left: 0px;
  right: 0px;
  bottom: 12px;
`

const PreviewDisplay = styled.div`
  position: relative;
  width: 100%;
  height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
`

const PreviewOptions = styled.div`
  position: relative;
  width: 100%;
  height: 31px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'VCR';
  font-size: 14px;
  text-transform: uppercase;
`

const Container = styled.div`
  height: calc(100% - 348px);
`

const toItems = (contract, collection) =>
  Object.keys(collection.items).map((tokenId) => ({
    contract,
    chainId: collection.meta.chainId,
    tokenId
  }))

const group = (items) => {
  return items.reduce((acc, id, index) => {
    if (index % 5 === 0) acc.push([])
    acc[acc.length - 1].push(id)
    return acc
  }, [])
}

const previewTitle = (name = '') => {
  if (name.length > 29) {
    return name.slice(0, 27) + '..'
  } else {
    return name
  }
}

const InventoryCollection = ({ expandedData = {}, inventory, onAssetClick, account }) => {
  const [hoverAsset, setHoverAsset] = useState(false)
  const k = expandedData.currentCollection
  if (!k || !account || !inventory) return

  useEffect(() => {
    if (k) {
      const collection = inventory[k]
      const items = toItems(k, collection)
      link.rpc('subscribeToItems', account, items, () => {})
    }
  }, [])

  const renderClusterRow = (row, i) => {
    while (row.length < 5) row.push(null) // Ensure the row has exactly 4 items
    return <ClusterRow key={`row-${i}}`}>{row.map(renderClusterValue)}</ClusterRow>
  }

  const renderClusterValue = (id, i) => {
    const item = inventory[k].items[id]
    if (!item) {
      return (
        <ClusterValue grow={1} transparent key={`empty-${Math.random()}`}>
          <div className='inventoryCollectionItem' />
        </ClusterValue>
      )
    }
    const { tokenId, name, img, externalLink } = item
    return (
      <ClusterValue
        key={tokenId}
        grow={1}
        onClick={() => externalLink && onAssetClick(externalLink)}
        onMouseEnter={() => {
          setHoverAsset({
            name,
            tokenId,
            img
          })
        }}
      >
        <div className='inventoryCollectionItem'>
          {img ? (
            <div className='inventoryCollectionItemImage'>
              <img
                src={img}
                // src={`${pylonProxy}?type=nft&target=${encodeURIComponent(img)}`}
                loading='lazy'
                alt={(name || '').toUpperCase()}
              />
            </div>
          ) : (
            <PulsateCircle index={i} />
          )}
        </div>
      </ClusterValue>
    )
  }

  return (
    <div className='inventoryDisplay'>
      <InventoryPreview>
        <ClusterBox style={{ height: '100%' }}>
          <Cluster>
            {hoverAsset && hoverAsset.img ? (
              <>
                <ClusterRow>
                  <ClusterValue>
                    <PreviewDisplay>
                      <div className='inventoryPreviewMedia'>
                        <img
                          // src={`${pylonProxy}?type=nft&target=${encodeURIComponent(hoverAsset.img)}`}
                          src={hoverAsset.img}
                          // loading='lazy'
                          alt={(hoverAsset.name || '').toUpperCase()}
                        />
                      </div>
                    </PreviewDisplay>
                  </ClusterValue>
                </ClusterRow>
                <ClusterRow height={'49px'}>
                  <ClusterValue>
                    <PreviewOptions key={hoverAsset.name}>{previewTitle(hoverAsset.name)}</PreviewOptions>
                  </ClusterValue>
                </ClusterRow>
              </>
            ) : (
              <>
                <ClusterRow>
                  <ClusterValue>
                    <PreviewDisplay>
                      <div
                        className='inventoryPreviewCollection'
                        style={
                          inventory[k].meta.image
                            ? {
                                // backgroundImage: `url(${pylonProxy}?type=nft&target=${encodeURIComponent(
                                //   inventory[k].meta.image
                                // )})`
                                backgroundImage: `url(${inventory[k].meta.image})`
                              }
                            : {}
                        }
                      />
                    </PreviewDisplay>
                  </ClusterValue>
                </ClusterRow>
                <ClusterRow height={'49px'}>
                  <ClusterValue>
                    <PreviewOptions key={inventory[k].meta.name}>
                      {previewTitle(inventory[k].meta.name)}
                    </PreviewOptions>
                  </ClusterValue>
                  <ClusterValue width={'49px'} onClick={() => {}}>
                    <div className='signerBalanceDrawerItem'>{svg.telescope(16)}</div>
                  </ClusterValue>
                  <ClusterValue width={'49px'} onClick={() => {}}>
                    <div className='signerBalanceDrawerItem'>{svg.show(16)}</div>
                  </ClusterValue>
                </ClusterRow>
              </>
            )}
          </Cluster>
          <Container
            onMouseLeave={() => {
              setHoverAsset(false)
            }}
          >
            <ClusterScroll>
              {group(
                Object.keys(inventory[k].items || {}).sort((a, b) => {
                  a = inventory[k].items[a].tokenId
                  b = inventory[k].items[b].tokenId
                  return a < b ? -1 : b > a ? 1 : 0
                })
              ).map(renderClusterRow)}
            </ClusterScroll>
          </Container>
        </ClusterBox>
      </InventoryPreview>
    </div>
  )
}

export default InventoryCollection
