import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../../resources/link'

import Main from './Main'
import Local from './Local'
import Networks from './Networks'
// import Notify from './Notify'
// import Phase from './Phase'
import Badge from './Badge'

import Dropdown from '../Components/Dropdown'

// import DevTools from 'restore-devtools'
// <DevTools />

class Panel extends React.Component {
  indicator (connection) {
    const status = [connection.primary.status, connection.secondary.status]
    if (status.indexOf('connected') > -1) {
      if (this.store('selected.current')) {
        return <div className='panelDetailIndicatorInner panelDetailIndicatorGood' />
      } else {
        return <div className='panelDetailIndicatorInner panelDetailIndicatorWaiting' />
      }
    } else {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorBad' />
    }
  }
  componentDidMount () {
    console.log('did mount')
    document.addEventListener('keydown', (event) => {
      console.log('event ky', event.key, this.store('panel.view'))
      const view = this.store('panel.view')
      if (event.key === 'ArrowRight') {
        if (view === 'networks') this.store.setPanelView('settings')
        if (view === 'settings') this.store.setPanelView('default')
        if (view === 'default') this.store.setPanelView('networks')
      } else if (event.key === 'ArrowLeft') {
        if (view === 'networks') this.store.setPanelView('default')
        if (view === 'settings') this.store.setPanelView('networks')
        if (view === 'default') this.store.setPanelView('settings')
      }
      // const key = event.key; // "ArrowRight", "ArrowLeft", "ArrowUp", or "ArrowDown"
    })
  }

  selectNetwork (network) {
    const [type, id] = network.split(':')
    if (network.type !== type || network.id !== id) link.send('tray:action', 'selectNetwork', type, id)
  }

  render () {
    // const open = this.store('tray.open')
    // console.log('tray open?', open)
    const opacity = this.store('tray.initial') ? 0 : 1 // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    // const opacity = open ? '1' : '0'
    // const transition = this.store('tray.initial') ? '0.64s cubic-bezier(.72,0,.32,1) all' : '0.16s cubic-bezier(.72,0,.32,1) all'
    const { type, id } = this.store('main.currentNetwork')

    let gasPrice = this.store('main.networks', type, id, 'gas.price.levels.standard')
    if (gasPrice) gasPrice = Math.round(parseInt(gasPrice, 'hex') / 1e9)
    const networks = this.store('main.networks')
    const networkOptions = []
    Object.keys(networks).forEach(type => {
      Object.keys(networks[type]).forEach(id => {
        networkOptions.push({ text: networks[type][id].name, value: type + ':' + id })
      })
    })
    let markLeft = 6
    if (this.store('panel.view') === 'networks') markLeft = 282
    if (this.store('panel.view') === 'settings') markLeft = 318
    return (
      <div id='panel' style={{ opacity }}>
        <div className='panelMenu'>
          <div className='panelMenuMarker'>
            <div className='panelMenuMark' style={{ transform: `translateX(${markLeft}px)` }} />
          </div>
          <div className='panelMenuItem panelMenuItemAccounts' onMouseDown={() => this.store.setPanelView('default')}>
            <div className='panelDetailIndicator'>
              {this.indicator(this.store('main.networks', type, id, 'connection'))}
            </div>
          </div>
          <div className='panelMenuItemNetwork'>
            <Dropdown
              syncValue={type + ':' + id}
              onChange={(network) => this.selectNetwork(network)}
              options={networkOptions}
            />
          </div>
          <div className='panelMenuItem panelMenuItemConnections' onMouseDown={() => this.store.setPanelView('networks')}>
            {svg.broadcast(15)}
          </div>
          <div className='panelMenuItem panelMenuItemSettings' onMouseDown={() => this.store.setPanelView('settings')}>
            {svg.octicon('settings', { height: 18 })}
          </div>
          {type === 'ethereum' && id === '1' ? (
            <div className='panelMenuData' style={{ opacity: this.store('view.addAccount') ? 0 : 1 }}>
              <div className='panelMenuDataItem'>
                {gasPrice || '---'}
                <div className='svg'>{svg.gas(9)}</div>
              </div>
              <div className='panelMenuDataDivide' />
              <div className='panelMenuDataItem'>
                <div className='usd'>{svg.usd(10.5)}</div>
                <div>{this.store('external.rates.USD') ? Math.floor(this.store('external.rates.USD')) : '---'}</div>
              </div>
            </div>
          ) : null}
        </div>
        <Local />
        <Networks />
        <Main />
        <Badge />
        {/* <div className='appMenu'>
          <div className='appMenuItem'>
            <div className='appMenuItemButton' onMouseDown={() => link.send('tray:toggleFlow')}>
              {svg.cpu(18)}
            </div>
          </div>
        </div> */}
      </div>
    )
  }
}

export default Restore.connect(Panel)
