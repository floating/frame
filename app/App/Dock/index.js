import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

import Main from './Main'
import Local from './Local'
import Dapps from './Dapps'
import Notify from './Notify'
import Badge from './Badge'
import Jump from './Jump'

const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

const color = {
  good: 'rgb(0, 210, 180)',
  bad: 'rgb(250, 100, 155)',
  berry: 'rgb(250, 150, 205)'
}

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
    let card = this.store('selected.card')
    let indicatorStyle = { transform: 'translate3d(0px, 16px, 0px) rotate(0deg)' }
    if (card === 'dapps') indicatorStyle.transform = 'translate3d(0px, 56px, 0px) rotate(180deg)'
    if (card === 'local') indicatorStyle.transform = 'translate3d(0px, 96px, 0px) rotate(0deg)'
    let mainHidden = this.store('tray.dockOnly') || !this.store('tray.open')
    if (mainHidden) indicatorStyle = { transform: 'translate3d(0px, -26px, 0px) rotate(180deg)', opacity: '0' }
    // if (mainHidden) indicatorStyle.left = '-8px'


    let dockMenuIndicatorClass = 'dockMenuIndicator'

    let dockMenuMainStyle = { borderColor: '' }

    /// if (account status is ready and we are on default make indicator green)
    const current = this.store('selected.current')
    if (current) {
      const account = this.store('main.accounts', this.store('selected.current'))
      if (account && account.signer && account.signer.status === 'ok') {
        dockMenuMainStyle = { borderColor: color.good }
        if ( card === 'default') dockMenuIndicatorClass = 'dockMenuIndicator dockMenuIndicatorGood'
      }
    }

    return (
      <div id='dock'>
        <Jump />
        <div className='dockDivide' />
        <div className='dockInset'>
          <div className='dockMenu'>
            <div className={dockMenuIndicatorClass} style={indicatorStyle}>
              <div className='dockMenuIndicatorLeft' />
              <div className='dockMenuIndicatorRight' />
            </div>
            <div className={card === 'default' & !mainHidden ? 'dockMenuItem dockMenuItemSelected' : 'dockMenuItem'} onMouseDown={() => {
              if (mainHidden) link.send('tray:dockSlide')
              this.store.setCard('default')
            }}>
              <div className='dockMenuMain' style={dockMenuMainStyle}>
                <div className='dockMenuMainIcon'>
                  <div>{svg.user(14)}</div>
                </div>
              </div>
            </div>
            <div className={card === 'dapps' & !mainHidden ? 'dockMenuItem dockMenuItemSelected' : 'dockMenuItem'} onMouseDown={() => {
            if (mainHidden) link.send('tray:dockSlide')
              this.store.setCard('dapps')
            }}>{svg.apps(14)}</div>
            <div className={card === 'local' & !mainHidden ? 'dockMenuItem dockMenuItemSelected' : 'dockMenuItem'} onMouseDown={() => {
              if (mainHidden) link.send('tray:dockSlide')
              this.store.setCard('local')
            }}>{svg.octicon('settings', { height: 18 })}</div>
          </div>
          <div className='dockPin'>
            <div className={this.store('main.pin') ? 'pinFrame pinFrameActive' : 'pinFrame'} onMouseDown={() => link.send('tray:pin')}>{svg.thumbtack(11)}</div>
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
          <Local />
          <Notify />
          <Badge />
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
