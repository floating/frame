import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { matchFilter } from '../../../../../resources/utils'
import styled, { keyframes } from 'styled-components'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import CollectionList from '../CollectionList'

const LoadingWave = keyframes`
  0% {
    transform: translateX(0);
  }
  100%{
    transform: translateX(74px);
  }
`
const BalanceLoading = styled.div`
  position: relative;
  height: 24px;
  width: 90px;
  display: flex;
  overflow: hidden;
  opacity: 1;
  padding: 1px 0px;
  border-radius: 12px;
  background: var(--ghostZ);
  border: 6px solid var(--ghostZ);
  color: var(--mint);
  box-sizing: border-box;
  margin: 0px 0px 6px 0px;

  svg {
    width: 300%;
    position: relative;
    left: -100%;
    stroke-width: 20px;
    animation: ${LoadingWave} 3.4s linear infinite;
    will-change: transform;
  }
`
class Inventory extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
          height: this.moduleRef.current.clientHeight
        })
      }
    })
  }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  isFilterMatch(collection) {
    const { filter = '', inventory } = this.props
    const c = inventory[collection]
    if (!c) return false
    const collectionName = c.meta && c.meta.name
    const collectionItems = c.items || {}
    const itemNames = Object.keys(collectionItems).map((item) => {
      const { name } = collectionItems[item] || {}
      return name
    })
    return matchFilter(filter, [collectionName, ...itemNames])
  }

  displayCollections() {
    const { inventory, visibilityDictionary } = this.props
    const collections = Object.keys(inventory || {})
    return collections
      .filter((k) => {
        const c = inventory[k]
        if (!c || !c.meta) return false
        const collectionId = `${c.meta.chainId}:${k}`
        const isHidden = visibilityDictionary[collectionId]
        return !isHidden
      })
      .sort((a, b) => {
        const assetsLengthA = inventory[a].meta.tokens.length
        const assetsLengthB = inventory[b].meta.tokens.length
        if (assetsLengthA > assetsLengthB) return -1
        if (assetsLengthA < assetsLengthB) return 1
        return 0
      })
      .filter((c) => this.isFilterMatch(c))
      .slice(0, 5)
  }

  render() {
    const { inventory } = this.props
    const collections = Object.keys(inventory || {})
    const displayCollections = this.displayCollections()
    const moreCollections = collections.length - displayCollections.length
    return (
      <div ref={this.moduleRef} className='balancesBlock' style={{}}>
        <div className='moduleHeader'>
          <span>{svg.inventory(12)}</span>
          <span>{'Inventory'}</span>
        </div>
        <Cluster>
          {collections.length ? (
            <CollectionList {...this.props} collections={this.displayCollections()} />
          ) : inventory ? (
            <ClusterRow>
              <ClusterValue>
                <div className='inventoryNotFound'>No Items Found</div>
              </ClusterValue>
            </ClusterRow>
          ) : (
            <ClusterRow>
              <ClusterValue>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <BalanceLoading>{svg.sine()}</BalanceLoading>
                  <div className='inventoryNotFound'>Loading Items</div>
                </div>
              </ClusterValue>
            </ClusterRow>
          )}
        </Cluster>
        {collections.length ? (
          <div className='signerBalanceTotal'>
            <div className='signerBalanceButtons'>
              <div
                className='signerBalanceButton signerBalanceShowAll'
                onClick={() => {
                  const crumb = {
                    view: 'expandedModule',
                    data: {
                      id: this.props.moduleId,
                      account: this.props.account
                    }
                  }
                  link.send('nav:forward', 'panel', crumb)
                }}
              >
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
