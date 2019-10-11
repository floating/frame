import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

import AppTile from './AppTile'

// import DevTools from 'restore-devtools'
// <DevTools />
const hashCode = str => str.split('').reduce((prevHash, currVal) => (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)
const fallbackColor = dapp => {
  const hex = hashCode(dapp.domain).toString(16).replace('-', '')
  const r = Math.round(((220 - 210) * (parseInt(hex[0] + hex[1], 16) / 255)) + 210)
  const g = Math.round(((220 - 210) * (parseInt(hex[2] + hex[3], 16) / 255)) + 210)
  const b = Math.round(((240 - 230) * (parseInt(hex[4] + hex[5], 16) / 255)) + 230)
  return `rgb(${r}, ${g}, ${b})`
}

class Dock extends React.Component {
  constructor (...args) {
    super(...args)
    this.addAppFill = 'Enter ENS Domain'
    this.state = {
      ensInput: this.addAppFill,
      pendingRemoval: false
    }
    this.added = []
    this.docked = []
    this.inDockCatch = false
    this.inAddedCatch = false
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

  tabDrag = e => {
    const deltaY = e.pageY - this.initialY
    this.currentTop = this.initialTop + deltaY
    if (this.currentTop < 0) this.currentTop = 0
    if (this.currentTop > this.topBound) this.currentTop = this.topBound
    const deltaX = e.pageX - this.initialX
    this.currentLeft = this.initialLeft + deltaX
    if (this.currentLeft < -10) this.currentLeft = -10
    if (this.currentLeft > this.leftBound) this.currentLeft = this.leftBound
    this.forceUpdate()
  }

  moveDrag (index, docked) {
    if (docked && !this.dragging.docked && this.docked.length >= 10) {
      this.setState({ dragHeadShake: true })
      setTimeout(() => this.setState({ dragHeadShake: false }), 1100)
      return
    }
    const drag = this.dragging
    const fromArea = drag.docked ? 'docked' : 'added'
    const toArea = docked ? 'docked' : 'added'
    link.rpc('moveDapp', fromArea, drag.index, toArea, index, (err) => {
      err ? console.error(err) : console.log('Dapp MOVED!')
      this.dragging.index = index
      this.dragging.docked = docked
      this.forceUpdate()
    })
  }

  releaseDrag = () => {
    if (this.state.pendingRemoval) {
      const drag = this.dragging
      link.rpc('removeDapp', drag.dapp.domain, (err) => { err ? console.error(err) : console.log('Dapp removed') })
    }
    this.dragging = null
    this.forceUpdate()
    this.setState({ pendingRemoval: false })
    window.removeEventListener('mousemove', this.tabDrag)
    window.removeEventListener('mouseup', this.releaseDrag)
  }

  removePending () {
    this.setState({ pendingRemoval: true })
  }

  cancelRemoval () {
    this.setState({ pendingRemoval: false })
  }

  onMouseDown = (e, dapp, index, docked) => {
    if (!this.store('dock.expand')) return
    this.dragging = { dapp, index, docked }
    const parent = e.target.offsetParent
    const offsetTop = parent.offsetTop
    const offsetLeft = parent.offsetLeft
    if (docked) {
      this.initialTop = this.currentTop = e.target.offsetTop + offsetTop - 10
      this.initialLeft = this.currentLeft = e.target.offsetLeft + offsetLeft - 10
    } else {
      const scrollTop = parent.scrollTop
      this.initialTop = this.currentTop = e.target.offsetTop - scrollTop + offsetTop
      this.initialLeft = this.currentLeft = e.target.offsetLeft + offsetLeft
    }
    this.topBound = parent.offsetParent.clientHeight - 68
    this.leftBound = parent.offsetParent.clientWidth - 68
    this.initialY = e.pageY
    this.initialX = e.pageX
    this.forceUpdate()
    window.addEventListener('mousemove', this.tabDrag)
    window.addEventListener('mouseup', this.releaseDrag)
  }

  render () {
    const open = this.store('tray.open')
    const dock = this.store('tray.dockOnly')
    const expanded = this.store('dock.expand')
    const base = open ? -425 : dock ? -55 : 0
    let transform = `translate3d(${base}px, 0px, 0px)`
    if (expanded) transform = `translate3d(${base - 293}px, 0px, 0px)`
    const transition = '0.32s cubic-bezier(.82,0,.12,1) all'
    const transitionDelay = '0s'
    return (
      <div id='dock' style={{ transform, transition, transitionDelay }}>
        <div className='overStoreShade' />
        <div className='underStoreShade' />
        <div className='dockInset'>
          <div className='appMovement'>
            {this.dragging ? (
              <div
                className={this.state.dragHeadShake ? 'draggedApp headshake' : 'draggedApp'}
                style={{ top: this.currentTop, left: this.currentLeft }}
              >
                <div className='draggedAppCard'>
                  <div className='appCardIconPlaceholder' style={{ background: fallbackColor(this.dragging.dapp) }}>
                    {this.dragging.dapp.domain[0].toUpperCase() + this.dragging.dapp.domain[1]}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className='expandFrame' onMouseDown={() => link.send('tray:expand')}>{svg.logo(16)}</div>
          <div className={this.store('main.pin') ? 'pinFrame pinFrameActive' : 'pinFrame'} onMouseDown={() => link.send('tray:pin')}>{svg.thumbtack(12)}</div>
          <div className='toggleDock' onMouseDown={this.handleToggleDock}>{svg.apps(17)}</div>
          <div className='appStore'>
            {this.dragging ? (
              <div className='addAppForm'>
                <div
                  className='removeApp'
                  onMouseEnter={e => this.removePending()}
                  onMouseLeave={e => this.cancelRemoval()}
                >
                  {this.state.pendingRemoval ? <div className='removeAppPending' /> : null}
                  {svg.trash(16)}
                </div>
              </div>
            ) : (
              <div className='addAppForm'>
                <div className='addAppInput'>
                  <input
                    value={this.state.ensInput}
                    onFocus={::this.handleOnFocus}
                    onBlur={::this.handleOnBlur}
                    onChange={e => this.setState({ ensInput: e.target.value })}
                    onKeyPress={e => { if (e.key === 'Enter') this.handleAddApp() }}
                  />
                </div>
                <div
                  className='addAppSubmit'
                  onMouseDown={::this.handleAddApp}
                >
                  {'Add Dapp'}
                </div>
              </div>
            )}
            <div
              className='dragCatchDock'
              onMouseMove={e => {
                if (this.inDockCatch) return
                const drag = this.dragging
                if (drag && !drag.docked) {
                  this.inDockCatch = true
                  const before = e.clientY < (e.target.clientHeight / 2)
                  this.moveDrag(before ? 0 : this.store('main.dappMap.docked').length, true)
                }
              }}
              onMouseLeave={e => {
                this.inDockCatch = false
              }}
            />
            <div className='dockApps' style={{ marginTop: `-${(this.store('main.dappMap.docked').length * 48) / 2}px` }}>
              {this.store('main.dappMap.docked').map((hash, i) => {
                return (
                  <AppTile
                    key={i}
                    index={i}
                    hash={hash}
                    dragging={this.dragging}
                    docked
                    mouseDown={(e, dapp, i) => this.onMouseDown(e, dapp, i, true)}
                    moveDrag={(...args) => this.moveDrag(...args)}
                  />
                )
              })}
            </div>
            <div className='addedApps'>
              <div
                className='dragCatch'
                onMouseMove={e => {
                  if (this.inAddedCatch) return
                  const drag = this.dragging
                  if (drag && drag.docked) {
                    this.inAddedCatch = true
                    this.moveDrag(this.store('main.dappMap.added').length, false)
                  }
                }}
                onMouseLeave={e => { this.inAddedCatch = false }}
              />
              {this.store('main.dappMap.added').map((hash, i) => {
                return (
                  <AppTile
                    key={i}
                    index={i}
                    hash={hash}
                    dragging={this.dragging}
                    docked={false}
                    mouseDown={(e, dapp, i) => this.onMouseDown(e, dapp, i, false)}
                    moveDrag={(...args) => this.moveDrag(...args)}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
