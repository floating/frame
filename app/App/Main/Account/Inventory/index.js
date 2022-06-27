import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

class Inventory extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
            height: this.moduleRef.current.clientHeight,
          })
        }
      })
    }
    this.state = {
      expand: false,
      hoverAsset: false,
    }
  }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  render() {
    const inventory = this.store('main.inventory', this.props.id)
    const collections = Object.keys(inventory || {})
    return (
      <div ref={this.moduleRef} className="balancesBlock">
        <div className="moduleHeader">
          {'Inventory'}
          {this.props.expanded ? (
            <div
              className="moduleHeaderClose"
              onMouseDown={() => {
                this.props.expandModule(false)
              }}
            >
              {svg.close(12)}
            </div>
          ) : null}
        </div>
        <div>
          {collections.length ? (
            collections
              .filter((k) => {
                if (this.props.expanded) {
                  const expandedData = this.props.expandedData || {}
                  const current = expandedData.currentCollection
                  return current === k
                } else {
                  return true
                }
              })
              .sort((a, b) => {
                const assetsLengthA = Object.keys(inventory[a].items).length
                const assetsLengthB = Object.keys(inventory[b].items).length
                if (assetsLengthA > assetsLengthB) return -1
                if (assetsLengthA < assetsLengthB) return 1
                return 0
              })
              .map((k) => {
                return (
                  <div
                    className="inventoryCollection"
                    onClick={() => {
                      this.props.expandModule(this.props.moduleId, { currentCollection: k })
                    }}
                    style={
                      this.props.expanded
                        ? {
                            position: 'absolute',
                            top: '30px',
                            right: '0',
                            bottom: '0',
                            left: '0',
                          }
                        : {}
                    }
                  >
                    {this.props.expanded ? (
                      <>
                        <div className="inventoryPreview">
                          {this.state.hoverAsset ? (
                            <div className="inventoryPreviewMedia">
                              {this.state.hoverAsset.img ? (
                                <img
                                  src={`https://proxy.pylon.link?type=nft&target=${encodeURIComponent(
                                    this.state.hoverAsset.img,
                                  )}`}
                                />
                              ) : null}
                            </div>
                          ) : (
                            <div
                              className="inventoryPreviewCollection"
                              style={
                                inventory[k].meta.image
                                  ? {
                                      backgroundImage: `url(https://proxy.pylon.link?type=nft&target=${encodeURIComponent(
                                        inventory[k].meta.image,
                                      )})`,
                                    }
                                  : {}
                              }
                            />
                          )}
                        </div>
                        <div className="inventoryPreviewTitle">
                          {this.state.hoverAsset ? this.state.hoverAsset.name : inventory[k].meta.name}
                        </div>
                        <div className="inventoryCollectionItems">
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
                                  className="inventoryCollectionItem"
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
                          <div className="inventoryCollectionLine" />
                        </div>
                      </>
                    ) : (
                      <div className="inventoryCollectionTop">
                        <div className="inventoryCollectionName">{inventory[k].meta.name}</div>
                        <div className="inventoryCollectionCount">{Object.keys(inventory[k].items).length}</div>
                        <div className="inventoryCollectionLine" />
                      </div>
                    )}
                  </div>
                )
              })
          ) : inventory ? (
            <div className="inventoryNotFound">No Items Found</div>
          ) : (
            <div className="inventoryNotFound">Loading Items..</div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Inventory)
