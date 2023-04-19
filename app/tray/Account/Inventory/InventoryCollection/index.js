import React, { useState, useEffect } from 'react'
import link from '../../../../../resources/link'

const toItems = (contract, collection) =>
  Object.keys(collection.items).map((tokenId) => ({
    contract,
    chainId: collection.meta.chainId,
    tokenId
  }))

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

  return (
    <div className='inventoryDisplay'>
      <div className='inventoryPreview'>
        {hoverAsset ? (
          <div className='inventoryPreviewMedia'>
            {hoverAsset.img ? (
              <img
                src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(hoverAsset.img)}`}
                loading='lazy'
                alt={hoverAsset.name.toUpperCase()}
              />
            ) : null}
          </div>
        ) : (
          <div
            className='inventoryPreviewCollection'
            style={
              inventory[k].meta.image
                ? {
                    backgroundImage: `url(https://proxy.pylon.link?type=nft&target=${encodeURIComponent(
                      inventory[k].meta.image
                    )})`
                  }
                : {}
            }
          />
        )}
      </div>
      <div className='inventoryPreviewTitle'>{hoverAsset ? hoverAsset.name : inventory[k].meta.name}</div>
      <div className='inventoryCollectionItems'>
        {Object.keys(inventory[k].items || {})
          .sort((a, b) => {
            a = inventory[k].items[a].tokenId
            b = inventory[k].items[b].tokenId
            return a < b ? -1 : b > a ? 1 : 0
          })
          .map((id) => {
            const { tokenId, name, img, externalLink } = inventory[k].items[id]
            return (
              <div
                key={id}
                className='inventoryCollectionItem'
                onClick={externalLink && onAssetClick(externalLink)}
                onMouseEnter={() => {
                  setHoverAsset({
                    name,
                    tokenId,
                    img
                  })
                }}
                onMouseLeave={() => {
                  setHoverAsset(false)
                }}
              >
                {img ? (
                  <div className='inventoryItemImage'>
                    <img
                      src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(img)}`}
                      loading='lazy'
                      alt={name.toUpperCase()}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        <div className='inventoryCollectionLine' />
      </div>
    </div>
  )
}

export default InventoryCollection
