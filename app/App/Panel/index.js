import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

import Main from './Main'
import Local from './Local'
import Notify from './Notify'
import Badge from './Badge'

// import DevTools from 'restore-devtools'
// <DevTools />

const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

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
    const expanded = this.store('dock.expand')
    const scale = 1.05
    const right = (((294 * scale) - 294) / 2) + 294
    const transform = expanded ? `translate3d(${right}px, 0px, 0px)` : 'translate3d(0px, 0px, 0px)'
    const boxShadow = expanded ? '-30px 0px 100px 0px rgba(16, 44, 100, .34)' : '0px 0px 0px rgba(16, 44, 100, 0)'
    // const open = this.store('tray.open')
    // const selected = this.store('selected.open')
    // const transition = '0.16s cubic-bezier(.82,0,.12,1) transform'
    // const transitionDelay = open ? '0s' : '0.06s'
    // const transitionDelay = open ? '0.64s' : '0s'
    // const transitionDelay = open ? '0.16s' : '0s'
    // style={{ transform, transition, transitionDelay }}
    return (
      <div id='panel' style={{ transform }} onMouseDown={() => { if (expanded) link.rpc('toggleDock', () => {}) }}>
        <div className={this.store('view.addAccount') ? 'panelMenu panelMenuAddMode' : 'panelMenu'}>
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
