import React from 'react'
import Restore from 'react-restore'
import link from '../../../resources/link'
import svg from '../../../resources/svg'

import styled from 'styled-components'

import { Cluster, ClusterRow, ClusterColumn, ClusterValue } from '../../../resources/Components/Cluster'

export const PanelMenu = styled.div`
  position: absolute;
  left: 8px;
  right: 8px;
  top: 12px;
  /* height: 63px; */
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  -webkit-app-region: no-drag;
  z-index: 1000000000;
  opacity: 1;
  transform: translate3d(0, 0, 0);
`
class Command extends React.Component {
  renderSignerIcon(type) {
    if (type === 'ledger') {
      return <div className='expandedSignerIcon'>{svg.ledger(20)}</div>
    } else if (type === 'trezor') {
      return <div className='expandedSignerIcon'>{svg.trezor(20)}</div>
    } else if (type === 'seed' || type === 'ring') {
      return <div className='expandedSignerIcon'>{svg.flame(23)}</div>
    } else if (type === 'lattice') {
      return <div className='expandedSignerIcon'>{svg.lattice(22)}</div>
    } else {
      return <div className='expandedSignerIcon'>{svg.logo(20)}</div>
    }
  }
  renderSignerTitle() {
    const { data = {} } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
    const signer = data.signer ? this.store('main.signers', data.signer) : {}
    if (!signer) return null
    return (
      <div className='expandedSignerTitle'>
        {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
        {this.renderSignerIcon(signer.type)}
        <div className='signerName'>{signer.name}</div>
      </div>
    )
  }
  render() {
    const { view } = this.store('windows.dash.nav')[0] || { view: '', data: {} }
    return (
      <PanelMenu>
        {this.store('windows.dash.nav').length ? (
          <Cluster>
            <ClusterRow>
              <ClusterValue
                width={60}
                onClick={() => {
                  link.send('tray:action', 'backDash')
                }}
              >
                <div style={{ width: '60px', height: '32px' }}>{svg.chevronLeft(16)}</div>
              </ClusterValue>
            </ClusterRow>
          </Cluster>
        ) : null}
        <div key={view} className='commandTitle cardShow'>
          {view === 'expandedSigner' ? this.renderSignerTitle() : view}
        </div>
        <Cluster>
          <ClusterRow>
            <ClusterValue
              width={60}
              onClick={() => {
                link.send('tray:action', 'closeDash')
              }}
            >
              <div style={{ width: '60px', height: '32px' }}> {svg.x(16)}</div>
            </ClusterValue>
          </ClusterRow>
        </Cluster>
      </PanelMenu>
    )
  }
}

export default Restore.connect(Command)
