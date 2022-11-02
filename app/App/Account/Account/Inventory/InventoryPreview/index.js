import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

class Inventory extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  isFilterMatch (collection) {
    const { filter = '' } =  this.props

    const c = this.store('main.inventory', this.props.account, collection)
    const itemMatch = Object.keys(c.items).some(item => {
      const { name } = c.items[item] || {}
      return (name || '').toLowerCase().indexOf(filter.toLowerCase()) !== -1
    })

    const match = (
      !filter ||
      c.meta.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
      itemMatch
    )

    return match
  }

  displayCollections () {
    const inventory = this.store('main.inventory', this.props.account)
    const collections = Object.keys(inventory || {})
    return collections.sort((a, b) => {
      const assetsLengthA = Object.keys(inventory[a].items).length
      const assetsLengthB = Object.keys(inventory[b].items).length
      if (assetsLengthA > assetsLengthB) return -1
      if (assetsLengthA < assetsLengthB) return 1
      return 0
    }).filter(c => this.isFilterMatch(c)).slice(0, 6)
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
              const crumb = {
                view: 'expandedModule', 
                data: {
                  id: this.props.moduleId,
                  account: this.props.account,
                  currentCollection: k
                }
              }
              link.send('nav:forward', 'panel', crumb)
            }}
          >
            <div className='inventoryCollectionTop'>
              <div className='inventoryCollectionName'>{inventory[k].meta.name}</div>
              <div className='inventoryCollectionCount'>{Object.keys(inventory[k].items).length}</div>
              <div className='inventoryCollectionLine' />
            </div>
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
        <div className='moduleHeader'>
          <span>{svg.inventory(12)}</span>
          <span>{'Inventory'}</span>
        </div>  
        <div className='inventoryWrapper'>
          {collections.length ? (
            this.renderInventoryList()
          ) : inventory ? (
            <div className='inventoryNotFound'>No Items Found</div>
          ) : (
            <div className='inventoryNotFound'>Loading Items..</div>
          )}
        </div>
        {collections.length ? (
          <div className='signerBalanceTotal'>
            <div className='signerBalanceButtons'>
              <div className='signerBalanceButton signerBalanceShowAll' onClick={() => {
                const crumb = {
                  view: 'expandedModule', 
                  data: {
                    id: this.props.moduleId,
                    account: this.props.account
                  }
                }
                link.send('nav:forward', 'panel', crumb)
              }}>
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
