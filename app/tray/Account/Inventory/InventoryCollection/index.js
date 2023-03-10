import React from 'react'
import Restore from 'react-restore'
import frameIcon from '../../../../../asset/FrameIcon.png'
import { LazyLoadImage } from '../../../../../resources/Components/LazyLoadImage'

class Inventory extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      hoverAsset: false
    }
  }

  render() {
    const inventory = this.store('main.inventory', this.props.account)
    const expandedData = this.props.expandedData || {}
    const k = expandedData.currentCollection
    return (
      <div className='inventoryDisplay'>
        <div className='inventoryPreview'>
          {this.state.hoverAsset ? (
            <div className='inventoryPreviewMedia'>
              {this.state.hoverAsset.img ? (
                <LazyLoadImage
                  src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(
                    this.state.hoverAsset.img
                  )}`}
                  placeholder={frameIcon}
                  width={94}
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
        <div className='inventoryPreviewTitle'>
          {this.state.hoverAsset ? this.state.hoverAsset.name : inventory[k].meta.name}
        </div>
        <div className='inventoryCollectionItems'>
          {Object.keys(inventory[k].items || {})
            .sort((a, b) => {
              a = inventory[k].items[a].tokenId
              b = inventory[k].items[b].tokenId
              return a < b ? -1 : b > a ? 1 : 0
            })
            .map((id) => {
              const { tokenId, name, img, openSeaLink } = inventory[k].items[id]
              return (
                <div
                  key={id}
                  className='inventoryCollectionItem'
                  onClick={() => {
                    this.store.notify('openExternal', { url: openSeaLink })
                  }}
                  onMouseEnter={() => {
                    this.setState({
                      hoverAsset: {
                        name,
                        tokenId,
                        img
                      }
                    })
                  }}
                  onMouseLeave={() => {
                    this.setState({
                      hoverAsset: false
                    })
                  }}
                >
                  {img ? (
                    <LazyLoadImage
                      src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(img)}`}
                      placeholder={frameIcon}
                      width={94}
                    />
                  ) : null}
                </div>
              )
            })}
          <div className='inventoryCollectionLine' />
        </div>
      </div>
    )
  }
}

export default Restore.connect(Inventory)
