import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'

import Main from './Main'
import Local from './Local'
import Notify from './Notify'
import Phase from './Phase'
import Badge from './Badge'

// import DevTools from 'restore-devtools'
// <DevTools />

class Panel extends React.Component {
  indicator (connection) {
    const status = [connection.primary.status, connection.secondary.status]
    if (status.indexOf('connected') > -1) {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorGood' />
    } else {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorBad' />
    }
  }

  render () {
    const open = this.store('tray.open')
    const transform = open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)' // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    // const opacity = open ? '1' : '0'
    const transition = this.store('tray.initial') ? '0.64s cubic-bezier(.82,0,.12,1) all' : '0.16s cubic-bezier(.82,0,.12,1) all'
    const { type, id } = this.store('main.currentNetwork')

    let gasPrice = this.store('main.networks', type, id, 'gas.price.levels.standard')
    if (gasPrice) gasPrice = Math.round(parseInt(gasPrice, 'hex') / 1e9)
    return (
      <div id='panel' style={{ transform, transition }}>
        <div className={this.store('view.addAccount') ? 'panelMenu panelMenuAddMode' : 'panelMenu'}>
          <div className='panelDetail'>
            <div className='panelDetailIndicator'>
              {this.indicator(this.store('main.networks', type, id, 'connection'))}
            </div>
            <div className='panelDetailText'>{this.store('main.networks', type, id, 'name')}</div>
          </div>
          {type === 'ethereum' && id === '1' ? (
            <div className='panelMenuData'>
              <div className='panelMenuDataItem'>
                <div className='svg'>{svg.gas(10)}</div>
                {gasPrice}
              </div>
              <div className='panelMenuDataItem'>
                <div className='usd'>$</div>
                <div>{this.store('external.rates.USD') ? Math.floor(this.store('external.rates.USD')) : ''}</div>
              </div>
            </div>
          ) : null}
          <div className='panelMenuItem' style={this.store('panel.view') !== 'default' ? { transform: 'rotate(180deg)' } : {}} onMouseDown={() => this.store.toggleSettings()}>
            <span className='panelMenuIconArrow'>{svg.octicon('chevron-right', { height: 14 })}</span>
            <span className='panelMenuIconArrow'>{svg.octicon('chevron-right', { height: 14 })}</span>
            <span className='panelMenuIconArrow'>{svg.octicon('chevron-right', { height: 14 })}</span>
          </div>
        </div>
        <Local />
        <Main />
        <Notify />
        <Phase />
        <Badge />
      </div>
    )
  }
}

export default Restore.connect(Panel)
