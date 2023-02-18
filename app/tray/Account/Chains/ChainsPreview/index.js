import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { matchFilter } from '../../../../../resources/utils'
import Gas from '../../../../../resources/Components/Gas'
import RingIcon from '../../../../../resources/Components/RingIcon'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

class ChainsPreview extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
            height: this.moduleRef.current.clientHeight
          })
        }
      })
    }
    this.state = {
      index: 0,
      lockedOn: false
    }
  }

  setIndex(newIndex) {
    if (this.state.lockedOn) return
    const existingChains = Object.keys(this.store('main.networks.ethereum') || []).filter((chain) => {
      return chain && this.store('main.networks.ethereum', chain, 'on')
    })
    if (newIndex > existingChains.length - 1) {
      this.setState({ index: 0 })
    } else if (newIndex < 0) {
      this.setState({ index: existingChains.length - 1 })
    } else {
      this.setState({ index: newIndex })
    }
  }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  render() {
    const { address } = this.store('main.accounts', this.props.account)
    const permissions = this.store('main.permissions', this.props.account) || {}
    let permissionList = Object.keys(permissions)
      .filter((o) => {
        const { filter = '' } = this.props
        return matchFilter(filter, [permissions[o].origin])
      })
      .sort((a, b) => (a.origin < b.origin ? -1 : 1))
    if (!this.props.expanded) permissionList = permissionList.slice(0, 4)

    const existingChainsIds =
      Object.keys(this.store('main.networks.ethereum')).map((id) => parseInt(id)) || []

    const existingChains = Object.keys(this.store('main.networks.ethereum')) || []
    const currentChainId = existingChains[this.state.index] || '1'
    const currentChain = this.store('main.networks.ethereum', currentChainId)
    const currentChainMeta = this.store('main.networksMeta.ethereum', currentChainId)
    if (!currentChain || !currentChainMeta) return null
    const { name } = currentChain
    const { icon, primaryColor } = currentChainMeta

    return (
      <div className='balancesBlock' ref={this.moduleRef}>
        <div className='moduleHeader'>
          <span style={{ marginLeft: '-2px' }}>{svg.chain(16)}</span>
          <span>{`${name} Monitor`}</span>
        </div>
        <Cluster>
          <ClusterRow>
            <ClusterValue onClick={() => link.send('tray:openExplorer', currentChain, null, address)}>
              <div style={{ padding: '6px', color: `var(--${primaryColor})` }}>
                <div>{svg.user(16)}</div>
              </div>
            </ClusterValue>
            <ClusterValue grow={3} onClick={() => this.setIndex(this.state.index + 1)}>
              <div style={{ padding: '6px' }}>
                <div style={{ transform: 'rotate(-90deg)' }}>{svg.chevron(26)}</div>
              </div>
            </ClusterValue>
            <ClusterValue grow={3} onClick={() => this.setIndex(this.state.index - 1)}>
              <div style={{ padding: '6px' }}>
                <div style={{ transform: 'rotate(90deg)' }}>{svg.chevron(26)}</div>
              </div>
            </ClusterValue>
          </ClusterRow>
          <Gas chainId={existingChainsIds[this.state.index] || 1} color={`var(--${primaryColor})`} />
        </Cluster>
      </div>
    )
  }
}

export default Restore.connect(ChainsPreview)
