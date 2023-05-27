import React, { useState, useEffect } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import useStore from '../../../../../resources/Hooks/useStore'

import {
  ClusterBox,
  ClusterScroll,
  Cluster,
  ClusterRow,
  ClusterValue
} from '../../../../../resources/Components/Cluster'

import { PulsateCircle, InventoryPreview, PreviewDisplay, PreviewOptions, Container } from './styled'

const toItems = (contract, collection) => {
  return collection.items.map((tokenId) => ({
    contract,
    chainId: collection.meta.chainId,
    tokenId
  }))
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
  const [confirmHide, setConfirmHide] = useState(false)
  const { meta } = inventory[k]

  const collectionId = `${meta.chainId}:${k}`
  const hiddenCollections = useStore('main.hiddenCollections') || []
  const isHidden = hiddenCollections.includes(collectionId)

  useEffect(() => {
    if (k) {
      const collection = inventory[k]
      const items = toItems(k, collection)
      link.rpc('subscribeToItems', account, items, () => {})
    }
  }, [])

  const renderClusterValue = (id, i) => {
    const item = inventory[k].items[id]
    if (!item) {
      return (
        <ClusterValue grow={1} transparent key={`empty-${Math.random()}`}>
          <div className='inventoryCollectionItem' />
        </ClusterValue>
      )
    }
    const { tokenId, name, img } = item
    return (
      <ClusterValue
        key={tokenId}
        grow={1}
        onClick={() => {
          link.send('tray:openExplorer', {
            type: 'token',
            chain: { type: 'ethereum', id: inventory[k].meta.chainId },
            address: k,
            tokenId
          })
        }}
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

  const group = (items) => {
    return items
      .reduce((acc, id, index) => {
        if (index % 4 === 0) acc.push([])
        acc[acc.length - 1].push(id)
        return acc
      }, [])
      .map((row, i) => {
        while (row.length < 4) row.push(null)
        return <ClusterRow key={`row-${i}}`}>{row.map(renderClusterValue)}</ClusterRow>
      })
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
                      <img src={hoverAsset.img} alt={(hoverAsset.name || '').toUpperCase()} />
                    </PreviewDisplay>
                  </ClusterValue>
                </ClusterRow>
                <ClusterRow height={'42px'}>
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
                                backgroundImage: `url(${inventory[k].meta.image})`
                              }
                            : {}
                        }
                      />
                    </PreviewDisplay>
                  </ClusterValue>
                </ClusterRow>
                {confirmHide ? (
                  <ClusterRow height={'42px'}>
                    <ClusterValue>
                      <PreviewOptions key={inventory[k].meta.name}>
                        {isHidden ? 'Unhide this collection?' : 'Hide this Collection?'}
                      </PreviewOptions>
                    </ClusterValue>
                    <ClusterValue
                      width={'42px'}
                      onClick={() => {
                        setConfirmHide(false)
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{svg.x(16)}</div>
                    </ClusterValue>
                    <ClusterValue
                      width={'42px'}
                      onClick={() => {
                        link.send('tray:action', 'collectionVisiblity', meta.chainId, k, !isHidden)
                        setConfirmHide(false)
                        if (!isHidden) link.send('nav:back', 'panel')
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{svg.check(16)}</div>
                    </ClusterValue>
                  </ClusterRow>
                ) : (
                  <ClusterRow height={'42px'}>
                    <ClusterValue>
                      <PreviewOptions key={inventory[k].meta.name}>
                        {previewTitle(inventory[k].meta.name)}
                      </PreviewOptions>
                    </ClusterValue>

                    <ClusterValue
                      width={'42px'}
                      onClick={() => {
                        link.send('tray:openExplorer', {
                          type: 'token',
                          chain: { type: 'ethereum', id: inventory[k].meta.chainId },
                          address: k
                        })
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{svg.telescope(16)}</div>
                    </ClusterValue>
                    <ClusterValue
                      width={'42px'}
                      onClick={() => {
                        setConfirmHide(true)
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{isHidden ? svg.show(16) : svg.hide(16)}</div>
                    </ClusterValue>
                  </ClusterRow>
                )}
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
              )}
            </ClusterScroll>
          </Container>
        </ClusterBox>
      </InventoryPreview>
    </div>
  )
}

export default InventoryCollection
