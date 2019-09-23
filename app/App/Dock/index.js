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
  constructor (...args) {
    super(...args)
    this.addAppFill = 'Enter ENS Domain'
    this.state = {
      ensInput: this.addAppFill
    }
  }

  handleAddApp () {
    if (this.state.ensInput === '' || this.state.ensInput === this.addAppFill) return
    const domain = this.state.ensInput
    const cb = (err) => { err ? console.error(err) : console.log('Dapp added') }
    link.rpc('addDapp', domain, cb)
  }

  handleToggleDock () {
    const cb = (err) => { err ? console.error(err) : console.log('toggleDock') }
    link.rpc('toggleDock', cb)
  }

  handleOnFocus () {
    if (this.state.ensInput === this.addAppFill) this.setState({ ensInput: '' })
  }

  handleOnBlur () {
    if (this.state.ensInput === '') this.setState({ ensInput: this.addAppFill })
  }

  render () {
    const open = this.store('tray.open')
    const selected = this.store('selected.open')
    const expanded = this.store('dock.expand')
    let transform = open && selected ? 'translate3d(-425px, 0px, 0px)' : 'translate3d(0px, 0px, 0px)'
    if (expanded && selected) transform = 'translate3d(-718px, 0px, 0px)'
    const transition = '0.32s cubic-bezier(.82,0,.12,1) all'
    const transitionDelay = expanded ? '0s' : selected ? open ? '0s' : '0s' : '0s'
    const dapps = Object.keys(this.store('main.dapps')).map((key) => this.store(`main.dapps.${key}`))
    return (
      <div id='dock' style={{ transform, transition, transitionDelay }}>
        <div className='expandFrame' onMouseDown={() => window.alert('Expand Frame')}>{svg.octicon('chevron-left', { height: 18 })}</div>
        <div className='toggleDock' onMouseDown={this.handleToggleDock}>{svg.octicon('plus', { height: 18 })}</div>
        <div className='dockApps'>
          {dapps.map(({ domain }, i) => {
            return <Dapp key={domain + i} domain={domain} />
          })}
        </div>
        <div className='appStore'>
          <div className='addApp'>
            <div className='addAppForm'>
              <div className='addAppInput'>
                <input value={this.state.ensInput} onFocus={::this.handleOnFocus} onBlur={::this.handleOnBlur} onChange={e => this.setState({ ensInput: e.target.value })} />
              </div>
              <div className='addAppSubmit' onMouseDown={::this.handleAddApp}>Add App</div>
            </div>
          </div>
          <div className='addedApps'>
            <div className='addedApp' />
            <div className='addedApp' />
            <div className='addedApp' />
            <div className='addedApp' />
            <div className='addedApp' />
            <div className='addedApp' />
          </div>
          <div className='appStoreShade' />
        </div>
        <div className='panelSwoop' style={{ bottom: '0px', top: '200px', left: '-20px', height: '1000px' }}>{svg.swoop()}</div>
        <div className='panelSwoopBottom' style={{ bottom: '0px', left: '-20px' }}>{svg.swoop()}</div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
