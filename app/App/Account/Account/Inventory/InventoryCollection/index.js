import React from 'react'
import Restore from 'react-restore'

class Inventory extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      hoverAsset: false,
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
                <img
                  src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(
                    this.state.hoverAsset.img
                  )}`}
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
                      )})`,
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
                        img,
                      },
                    })
                  }}
                  onMouseLeave={() => {
                    this.setState({
                      hoverAsset: false,
                    })
                  }}
                >
                  {img ? (
                    <img src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(img)}`} />
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
