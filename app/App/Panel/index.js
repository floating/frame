import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'

import Main from './Main'
import Local from './Local'
import Notify from './Notify'
import Badge from './Badge'

// import DevTools from 'restore-devtools'
// <DevTools />

class Panel extends React.Component {
  indicator (connection) {
    const status = [connection.local.status, connection.secondary.status]
    if (status.indexOf('connected') > -1) {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorGood' />
    } else {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorBad' />
    }
  }

  render () {
    const open = this.store('tray.open')
    const transform = open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)' // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    const transition = this.store('tray.initial') ? '0.64s cubic-bezier(.82,0,.12,1) all' : '0.16s cubic-bezier(.82,0,.12,1) all'
    return (
      <div id='panel' style={{ transform, transition }}>
        <div className='panelSwoop'>{svg.swoop()}</div>
        <div className='panelSwoopBottom'>{svg.swoop()}</div>
        <div className={this.store('view.addAccount') ? 'panelMenu panelMenuAddMode' : 'panelMenu'}>
          <div className='panelDetail'>
            <div className='panelDetailIndicator'>
              {this.indicator(this.store('main.connection'))}
            </div>
            <div className='panelDetailText'>{this.store('main.networks', this.store('main.connection.network'), 'name')}</div>
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
