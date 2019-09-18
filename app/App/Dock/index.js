import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

// import DevTools from 'restore-devtools'
// <DevTools />

// const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

class Dock extends React.Component {
  render () {
    const open = this.store('tray.open')
    const selected = this.store('selected.open')
    const transform = open && selected ? 'translate3d(0px, 0px, 0px)' : 'translate3d(440px, 0px, 0px)' // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    const transition = '0.32s cubic-bezier(.82,0,.12,1) all'
    const transitionDelay = selected ? open ? '0.32s' : '0s' : '0s'
    return (
      <div id='dock' style={{ transform, transition, transitionDelay }}>
        <div className='expandFrame' onMouseDown={() => window.alert('Expand Frame')}>{svg.octicon('chevron-left', { height: 18 })}</div>
        <div className='addApp' onMouseDown={() => window.alert('Add Dapp')}>{svg.octicon('plus', { height: 18 })}</div>
        <div className='dockApps'>
          <div className='dockAppIcon' onMouseDown={() => link.send('tray:openExternal', 'https://frame.sh')}>{svg.aragon(22)}</div>
          <div className='dockAppIcon' onMouseDown={() => window.alert('Launch Dapp 2')}>{svg.aragon(22)}</div>
          <div className='dockAppIcon' onMouseDown={() => window.alert('Launch Dapp 3')}>{svg.aragon(22)}</div>
          <div className='dockAppIcon' onMouseDown={() => window.alert('Launch Dapp 4')}>{svg.aragon(22)}</div>
          <div className='dockAppIcon' onMouseDown={() => window.alert('Launch Dapp 5')}>{svg.aragon(22)}</div>
          <div className='dockAppIcon' onMouseDown={() => window.alert('Launch Dapp 6')}>{svg.aragon(22)}</div>
        </div>
        <div className='panelSwoop' style={{ bottom: '0px', top: '200px', left: '-20px', height: '1000px' }}>{svg.swoop()}</div>
        <div className='panelSwoopBottom' style={{ bottom: '0px', left: '-20px' }}>{svg.swoop()}</div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
