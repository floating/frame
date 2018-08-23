import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'

import Main from './Main'
import Local from './Local'

const networks = {1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan'}

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
    return (
      <div id='panel' style={{transform: open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'}}>
        <div className='panelMenu'>
          <div className='panelDetail'>
            <div className='panelDetailIndicator'>
              {this.indicator(this.store('local.connection'))}
            </div>
            <div className='panelDetailText'>{networks[this.store('local.connection.network')]}</div>
          </div>
          <div className='panelMenuItem' style={this.store('panel.view') !== 'default' ? {transform: 'rotate(180deg)'} : {}} onClick={() => this.store.toggleSettings()}>
            {svg.octicon('kebab-horizontal', {height: 21})}
          </div>
        </div>
        <Local />
        <Main />
      </div>
    )
  }
}

export default Restore.connect(Panel)
