import React, { useState, useEffect } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import useStore from '../../../../../resources/Hooks/useStore'
import DisplayMedia from '../../../../../resources/Components/DisplayMedia'

import {
  ClusterBox,
  ClusterScroll,
  Cluster,
  ClusterRow,
  ClusterValue
} from '../../../../../resources/Components/Cluster'

import {
  PulsateCircle,
  InventoryPreview,
  PreviewDisplay,
  CollectionMedia,
  PreviewOptions,
  Container
} from './styled'

const previewTitle = (name = '') => {
  if (name.length > 29) {
    return name.slice(0, 27) + '..'
  } else {
    return name
  }
}

const InventoryCollection = ({ expandedData = {}, inventory, onAssetClick, account }) => {
  const [hoverAsset, setHoverAsset] = useState(false)
  const { currentCollection } = expandedData
  const k = expandedData.currentCollection
  if (!k || !account || !inventory) return
  const [confirmHide, setConfirmHide] = useState(false)
  const { meta } = inventory[k]

  const collectionId = `${meta.chainId}:${k}`
  const collectionPreferences = useStore('main.assetPreferences.collections') || {}
  const preferences = collectionPreferences[collectionId]
  const isHidden = preferences ? preferences.hidden : meta.hideByDefault || false

  useEffect(() => {
    if (k) {
      const collection = inventory[currentCollection]
      const items = collection.meta.tokens.map((tokenId) => ({
        contract: currentCollection,
        chainId: collection.meta.chainId,
        tokenId: tokenId
      }))
      link.rpc('subscribeToItems', account, items, () => {})
    }
  }, [])

  const renderClusterValue = (item, i) => {
    if (!item) {
      return (
        <ClusterValue grow={1} transparent key={`empty-${Math.random()}`}>
          <div className='inventoryCollectionItem' />
        </ClusterValue>
      )
    }
    const { tokenId, name, media } = item

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
            media
          })
        }}
      >
        <div className='inventoryCollectionItem'>
          {media ? (
            <div className='inventoryCollectionItemImage'>
              <DisplayMedia media={media} frozen={true} lazy={true} alt={(name || '').toUpperCase()} />
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
            {hoverAsset && hoverAsset.media ? (
              <>
                <ClusterRow>
                  <ClusterValue>
                    <PreviewDisplay>
                      <DisplayMedia
                        media={hoverAsset.media}
                        alt={(hoverAsset.name || '').toUpperCase()}
                        audio={true}
                        full={true}
                      />
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
                      <CollectionMedia>
                        <DisplayMedia media={inventory[k].meta.media} />
                      </CollectionMedia>
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
                        link.send('tray:action', 'updateAssetPreferences', 'collections', meta.chainId, k, {
                          hidden: !isHidden
                        })
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
                (() => {
                  let items = inventory[k].items || []
                  let tokens = (inventory[k].meta.tokens || []).map((tokenId) => ({ tokenId }))

                  let combinedItems = [...items]

                  tokens.forEach((token) => {
                    if (!items.find((item) => item.tokenId === token.tokenId)) {
                      combinedItems.push(token)
                    }
                  })

                  combinedItems.sort((a, b) => {
                    a = a.tokenId
                    b = b.tokenId
                    return a < b ? -1 : b > a ? 1 : 0
                  })

                  return combinedItems
                })()
              )}
            </ClusterScroll>
          </Container>
        </ClusterBox>
      </InventoryPreview>
    </div>
  )
}

export default InventoryCollection
