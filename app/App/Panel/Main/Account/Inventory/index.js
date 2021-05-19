import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })
    this.state = {
      expand: false
    }
  }
  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  } 
  render () {
    const inventory = this.store('main.inventory', this.props.id)
    const collections = Object.keys(inventory || {})
    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>{'Inventory'}</div>  
        <div>
          {collections.length ? collections.map(k => {
            return (
              <div className='inventoryCollection'>
                <div className='inventoryCollectionName'>{inventory[k].meta.name}</div>
                <div className='inventoryCollectionCount'>{Object.keys(inventory[k].assets).length}</div>
                <div className='inventoryCollectionLine' />
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