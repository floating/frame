import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

import Main from './Main'
import Local from './Local'
import Dapps from './Dapps'
import Notify from './Notify'
import Badge from './Badge'

const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

// import DevTools from 'restore-devtools'
// <DevTools />
// const hashCode = str => str.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)
// const fallbackColor = dapp => {
//   const hex = hashCode(dapp.domain).toString(16).replace('-', '')
//   const r = Math.round(((220 - 210) * (parseInt(hex[0] + hex[1], 16) / 255)) + 210)
//   const g = Math.round(((220 - 210) * (parseInt(hex[2] + hex[3], 16) / 255)) + 210)
//   const b = Math.round(((240 - 230) * (parseInt(hex[4] + hex[5], 16) / 255)) + 230)
//   return `rgb(${r}, ${g}, ${b})`
// // }

class _Card extends React.Component {
  render () {
    const current = this.store('selected.card') === 'local'
    const dockCardClass = current ? 'dockCard cardShow' : 'dockCard cardHide'
    return (
      <div className={dockCardClass}>
        <div className='dockCardInset'>
          <Local />
        </div>
      </div>
    )
  }
}

const Card = Restore.connect(_Card)

class Dock extends React.Component {
  indicator (connection) {
    const status = [connection.local.status, connection.secondary.status]
    if (status.indexOf('connected') > -1) {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorGood' />
    } else {
      return <div className='panelDetailIndicatorInner panelDetailIndicatorBad' />
    }
  }

  render () {
    // const ipfsReady = this.store('main.clients.ipfs.state') === 'ready'
    // const open = this.store('tray.open')
    // const dock = this.store('tray.dockOnly')
    // const base = open || this.store('dock.expand') ? -425 : dock ? -55 : 0
    // const transform = `translate3d(${base}px, 0px, 0px)`
    // if (expanded) transform = `translate3d(${base - 293}px, 0px, 0px)`
    // const transition = '0.24s cubic-bezier(.82,0,.42,1) transform'
    // const transitionDelay = '0s' // open && !dock && this.delayDock ? '0.16s' : '0s'
    // style={{ transform, transition, transitionDelay }}
    // <div className='overStoreShade' />
    // {ipfsReady ? (
    //   <div className='toggleDock' onMouseDown={this.handleToggleDock}>{svg.apps(17)}</div>
    // ) : null}
    const indicatorStyle = { left: '0px' }
    if (this.store('selected.card') === 'dapps') indicatorStyle.left = '36px'
    if (this.store('selected.card') === 'local') indicatorStyle.left = '69px'
    return (
      <div id='dock'>
        <div className='dockInset'>
          <div className='dockMenu'>
            <div className='dockMenuLeft'>
              <div className='dockMenuIndicator' style={indicatorStyle}>
                <div className='dockMenuIndicatorRight'>{svg.roundedTri(14)}</div>
              </div>
              <div className='dockMenuItem'>
                <div className='dockMenuMain'>
                  <div className='dockMenuMainIcon'>
                    <div onMouseDown={() => this.store.setCard('default')}>{svg.user(14)}</div>
                  </div>
                </div>
              </div>
              <div className='dockMenuItem' onMouseDown={() => this.store.setCard('dapps')}>{svg.apps(15)}</div>
              <div className='dockMenuItem' onMouseDown={() => this.store.setCard('local')}>{svg.octicon('settings', { height: 19 })}</div>
            </div>
            <div className='dockMenuRight'>
              <div className={this.store('main.pin') ? 'pinFrame pinFrameActive' : 'pinFrame'} onMouseDown={() => link.send('tray:pin')}>{svg.thumbtack(11)}</div>
            </div>
          </div>
          {/* <div className={this.store('view.addAccount') ? 'panelMenu panelMenuAddMode' : 'panelMenu'}>
            <div className='panelDetail'>
              <div className='panelDetailIndicator'>
                <div className='panelDetailIndicatorShade'>
                  {this.indicator(this.store('main.connection'))}
                </div>
              </div>
              <div className='panelDetailText'>{networks[this.store('main.connection.network')]}</div>
            </div>
          </div>
          <div className='dockMenuIndicator' style={indicatorStyle}>
            <div className='dockMenuIndicatorRight'>{svg.roundedTri(8)}</div>
          </div>
          <div className='expandFrame' onMouseDown={() => this.store.setCard('default')}>{svg.logo(14)}</div>
          <div className='expandFrame selectDapps' onMouseDown={() => this.store.setCard('dapps')}>{svg.apps(14)}</div>
          <div className='expandFrame selectSettings' onMouseDown={() => this.store.setCard('local')}>{svg.octicon('settings', { height: 18 })}</div> */}
          {/* <div className={this.store('main.pin') ? 'pinFrame pinFrameActive' : 'pinFrame'} onMouseDown={() => link.send('tray:pin')}>{svg.thumbtack(11)}</div> */}
          <Main />
          <Dapps />
          <Card name='local' />
          <Notify />
          <Badge />
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
