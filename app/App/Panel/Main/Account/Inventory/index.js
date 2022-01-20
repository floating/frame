import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

class Balances extends React.Component {
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
      expand: false
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }
  render () {
    const inventory = this.store('main.inventory', this.props.id)
    const collections = Object.keys(inventory || {})
    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>
          {'Inventory'}
          {this.props.expanded ? (
            <div className='moduleHeaderClose' onMouseDown={() => this.props.expandModule(false)}>
              {svg.close(12)}
            </div>
          ) : null}
        </div>  
        <div>
          {collections.length ? collections.map(k => {
            return (
              <div className='inventoryCollection' onMouseDown={() => this.props.expandModule(this.props.moduleId)}>
                <div className='inventoryCollectionTop'>
                  <div className='inventoryCollectionName'>{inventory[k].meta.name}</div>
                  <div className='inventoryCollectionCount'>{Object.keys(inventory[k].assets).length}</div>
                  <div className='inventoryCollectionLine' />
                </div>
                {this.props.expanded ? (
                  <div className='inventoryCollectionItems'>
                    {Object.keys(inventory[k].assets || {}).sort((a, b) => {
                      a = inventory[k].assets[a].tokenId
                      b = inventory[k].assets[b].tokenId
                      return a < b ? -1 : b > a ? 1 : 0
                    }).map(id => {
                      const { tokenId, name, img } = inventory[k].assets[id]
                      return (
                        <div className='inventoryCollectionItem'>
                          {img ? <img src={`https://proxy.pylon.link?target=${img}`} /> : null}
                        </div>
                      )
                    })}
                    <div className='inventoryCollectionLine' />
                  </div>
                ) : null}
              </div>
            )
          }) : inventory ? (
            <div className='inventoryNotFound'>No Items Found</div>
          ) : (
            <div className='inventoryNotFound'>Loading Items..</div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)