import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

// import DevTools from 'restore-devtools'
// <DevTools />

// const networks = { 1: 'Mainnet', 3: 'Ropsten', 4: 'Rinkeby', 42: 'Kovan' }

const Dapp = ({ domain }) => {
  const handleClick = (e) => {
    if (e.button === 2) link.rpc('removeDapp', domain, (err) => { err ? console.error(err) : console.log('Dapp removed') })
    else link.rpc('launchDapp', domain, (err) => { err ? console.error(err) : console.log('Dapp launched') })
  }
  return (
    <div className='dockAppIcon' onMouseDown={handleClick}>{svg.aragon(22)}</div>
  )
}

class Dock extends React.Component {
  addDapp () {
    const domain = 'monkybrain.eth'
    const cb = (err) => { err ? console.error(err) : console.log('Dapp added') }
    link.rpc('addDapp', domain, cb)
  }

  render () {
    const open = this.store('tray.open')
    const selected = this.store('selected.open')
    const transform = open && selected ? 'translate3d(0px, 0px, 0px)' : 'translate3d(440px, 0px, 0px)' // open ? 'translate3d(0px, 0px, 0px)' : 'translate3d(370px, 0px, 0px)'
    const transition = '0.32s cubic-bezier(.82,0,.12,1) all'
    const transitionDelay = selected ? open ? '0.32s' : '0s' : '0s'
    const dapps = Object.keys(this.store('main.dapps')).map((key) => this.store(`main.dapps.${key}`))
    return (
      <div id='dock' style={{ transform, transition, transitionDelay }}>
        <div className='expandFrame' onMouseDown={() => window.alert('Expand Frame')}>{svg.octicon('chevron-left', { height: 18 })}</div>
        <div className='addApp' onMouseDown={this.addDapp}>{svg.octicon('plus', { height: 18 })}</div>
        <div className='dockApps'>
          { dapps.map(({ domain }) => {
            return <Dapp domain={domain} />
          })}
        </div>
        <div className='panelSwoop' style={{ bottom: '0px', top: '200px', left: '-20px', height: '1000px' }}>{svg.swoop()}</div>
        <div className='panelSwoopBottom' style={{ bottom: '0px', left: '-20px' }}>{svg.swoop()}</div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
