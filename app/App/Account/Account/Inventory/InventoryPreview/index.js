import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

class Inventory extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
        }
      })
    }
    this.state = {
      expand: false,
      hoverAsset: false
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  displayCollections () {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    return collections.filter(k => {
      if (this.props.expanded) {
        const expandedData = this.props.expandedData || {}
        const current = expandedData.currentCollection
        return current === k
      } else {
        return true
      }
    }).sort((a, b) => {
      const assetsLengthA = Object.keys(inventory[a].items).length
      const assetsLengthB = Object.keys(inventory[b].items).length
      if (assetsLengthA > assetsLengthB) return -1
      if (assetsLengthA < assetsLengthB) return 1
      return 0
    }).slice(0, this.props.expanded ? this.length : 6)
  }

  renderInventoryList () {
    const inventory = this.store('main.inventory', this.props.account)
    const displayCollections = this.displayCollections()
    return (
      displayCollections.map(k => {
        return (
          <div 
            key={k}
            className='inventoryCollection'
            onClick={() => {
              if (!this.props.expanded) this.props.expandModule({ id: this.props.moduleId, account: this.props.account, currentCollection: k })
            }}
          >
            {this.props.expanded ? (
              <div className='expandedModule'>
                <div className='inventoryPreview'>
                  {this.state.hoverAsset ? (
                    <div className='inventoryPreviewMedia'>
                      {this.state.hoverAsset.img ? <img src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(this.state.hoverAsset.img)}`} /> : null}
                    </div>
                  ) : (
                    <div 
                      className='inventoryPreviewCollection'
                      style={inventory[k].meta.image ? {
                        backgroundImage: `url(https://proxy.pylon.link?type=nft&target=${encodeURIComponent(inventory[k].meta.image)})`
                      } : {}}
                    />
                  )}
                </div>
                <div className='inventoryPreviewTitle'>{this.state.hoverAsset ? this.state.hoverAsset.name : inventory[k].meta.name}</div>
                <div className='inventoryCollectionItems'>
                  {Object.keys(inventory[k].items || {}).sort((a, b) => {
                    a = inventory[k].items[a].tokenId
                    b = inventory[k].items[b].tokenId
                    return a < b ? -1 : b > a ? 1 : 0
                  }).map(id => {
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
                        {img ? <img src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(img)}`} /> : null}
                      </div>
                    )
                  })}
                  <div className='inventoryCollectionLine' />
                </div>
              </div>
            ) : inventory[k] ? (
              <div className='inventoryCollectionTop'>
                <div className='inventoryCollectionName'>{inventory[k].meta.name}</div>
                <div className='inventoryCollectionCount'>{Object.keys(inventory[k].items).length}</div>
                <div className='inventoryCollectionLine' />
              </div>
            ) : 'NO COLLECTION'}
          </div>
        )
      })
    )
  }

  render () {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    const displayCollections = this.displayCollections()
    const moreCollections = collections.length - displayCollections.length
    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        {!this.props.expanded ? (
          <div className='moduleHeader'>
            <span>{svg.inventory(12)}</span>
            <span>{'Inventory'}</span>
          </div>  
        ) : null}
        <div className='inventoryWrapper'>
          {collections.length ? (
            this.renderInventoryList()
          ) : inventory ? (
            <div className='inventoryNotFound'>No Items Found</div>
          ) : (
            <div className='inventoryNotFound'>Loading Items..</div>
          )}
        </div>
        {!this.props.expanded && collections.length ? (
          <div className='signerBalanceTotal'>
            <div className='signerBalanceButtons'>
              <div className='signerBalanceButton signerBalanceShowAll' onMouseDown={() => this.props.expandModule({ id: this.props.moduleId, account: this.props.account })}>
                {moreCollections > 0 ? `+${moreCollections} More` : 'More'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Inventory)
