import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'

import Main from './Main'
import Local from './Local'
import Notify from './Notify'
import Badge from './Badge'

// import DevTools from 'restore-devtools'
// <DevTools />

const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

class Panel extends React.Component {
  indicator (connection) {
    let status = [connection.local.status, connection.secondary.status]
    if (status.indexOf('connected') > -1) {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorGood' />
    } else {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorBad' />
    }
  }
  render () {
    let open = this.store('tray.open')
    let transform = open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)' // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    let opacity = open ? 1 : 0
    return (
      <div id='panel' style={{ transform, opacity }}>
        <div className='panelMenu'>
          <div className='panelDetail'>
            <div className='panelDetailIndicator'>
              {this.indicator(this.store('main.connection'))}
            </div>
            <div className='panelDetailText'>{networks[this.store('main.connection.network')]}</div>
          </div>
          <div className='panelMenuItem' style={this.store('panel.view') !== 'default' ? { transform: 'rotate(180deg)' } : {}} onMouseDown={() => this.store.toggleSettings()}>
            <span className='panelMenuIconArrow'>{svg.octicon('chevron-right', { height: 14 })}</span>
            <span className='panelMenuIconArrow'>{svg.octicon('chevron-right', { height: 14 })}</span>
            <span className='panelMenuIconArrow'>{svg.octicon('chevron-right', { height: 14 })}</span>
          </div>
        </div>
        <Local />
        <Main />
        <Notify />
        <Badge />
      </div>
    )
  }
}

export default Restore.connect(Panel)

// <span>{svg.octicon('kebab-horizontal', { height: 21 })}</span>
// <span className='panelMenuIconArrow'>{svg.octicon('chevron-right', { height: 16 })}</span>
