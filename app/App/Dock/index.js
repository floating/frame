import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

// import DevTools from 'restore-devtools'
// <DevTools />

// const Dapp = ({ domain, pinned }) => {
//   const handleClick = (e) => {
//     if (e.button === 2) return link.rpc('removeDapp', domain, (err) => { err ? console.error(err) : console.log('Dapp removed') })
//     if (!pinned) return window.alert('Dapp not pinned yet')
//     link.rpc('launchDapp', domain, (err) => { err ? console.error(err) : console.log('Dapp launched') })
//   }
//   const classNames = pinned ? 'dockAppIcon' : 'dockAppIcon dockAppIconNotPinned'
//   return (
//     <div className={classNames} onMouseDown={handleClick}>{svg.aragon(40)}</div>
//   )
// }

// class _App extends React.Component {
//   constructor (...args) {
//   }
//   render () {
//     const docked = this.props.docked
//   }
// }
//
// const App = Restore.connect(_App)

// const randomColor = () => {
//   const v = (f, c) => Math.round(Math.random() * (c - f)) + f
//   return `rgb(${v(40, 200)}, ${v(90, 140)}, ${v(90, 210)})`
// }

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
    // const removeFrom = drag.docked ? this.docked : this.added
    // removeFrom.splice(drag.index, 1)
    // const addTo = docked ? this.docked : this.added
    // addTo.splice(index, 0, drag.dapp)
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

  onMouseDownDocked = (e, dapp, index) => {
    if (!this.store('dock.expand')) return
    this.dragging = { dapp, index, docked: true }
    const parent = e.target.offsetParent
    const offsetTop = parent.offsetTop
    const offsetLeft = parent.offsetLeft
    this.topBound = parent.offsetParent.clientHeight - 68
    this.leftBound = parent.offsetParent.clientWidth - 68
    this.initialY = e.pageY
    this.initialX = e.pageX
    this.initialTop = this.currentTop = e.target.offsetTop + offsetTop - 10
    this.initialLeft = this.currentLeft = e.target.offsetLeft + offsetLeft - 10
    this.forceUpdate()
    window.addEventListener('mousemove', this.tabDrag)
    window.addEventListener('mouseup', this.releaseDrag)
  }

  onMouseDownUndocked = (e, dapp, index) => {
    if (!this.store('dock.expand')) return
    this.dragging = { dapp, index, docked: false }
    const parent = e.target.offsetParent
    const scrollTop = parent.scrollTop
    const offsetTop = parent.offsetTop
    const offsetLeft = parent.offsetLeft
    this.topBound = parent.offsetParent.clientHeight - e.target.clientHeight
    this.leftBound = parent.offsetParent.clientWidth - e.target.clientWidth
    this.initialY = e.pageY
    this.initialX = e.pageX
    this.initialTop = this.currentTop = e.target.offsetTop - scrollTop + offsetTop
    this.initialLeft = this.currentLeft = e.target.offsetLeft + offsetLeft
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
        <div className='appMovement'>
          {this.dragging ? (
            <div
              className={this.state.dragHeadShake ? 'draggedApp headshake' : 'draggedApp'}
              style={{
                top: this.currentTop,
                left: this.currentLeft,
                color: this.dragging.dapp.color
              }}
            >
              <div className='draggedAppCard'>
                {this.dragging.dapp.domain[0].toUpperCase() + this.dragging.dapp.domain[1]}
              </div>
            </div>
          ) : null}
        </div>
        <div className='expandFrame' onMouseDown={() => window.alert('Expand Frame')}>{svg.logo(16)}</div>
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
                this.moveDrag(before ? 0 : this.docked.length, true)
              }
            }}
            onMouseLeave={e => {
              this.inDockCatch = false
            }}
          />
          <div className='dockApps' style={{ marginTop: `-${(this.docked.length * 48) / 2}px` }}>
            {this.store('main.dappMap.docked').map((hash, i) => {
              const dapp = this.store(`main.dapps.${hash}`)
              const drag = this.dragging
              if (drag && drag.dapp && drag.docked === true && drag.index === i) {
                return (
                  <div
                    key={i}
                    className='dockedApp'
                    style={{ color: dapp.color }}
                  >
                    <div style={{ opacity: 0.3 }}>
                      {dapp.domain[0].toUpperCase() + dapp.domain[1]}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div
                    key={i}
                    className='dockedApp'
                    onMouseDown={e => {
                      e.persist()
                      this.enableDragTimeout = setTimeout(() => {
                        this.onMouseDownDocked(e, dapp, i)
                      }, 200)
                    }}
                    onMouseUp={e => {
                      clearTimeout(this.enableDragTimeout)
                      if (!this.dragging) link.rpc('launchDapp', dapp.domain, (err) => { err ? console.error(err) : console.log('Dapp launched') })
                    }}
                    onMouseEnter={e => { if (drag) this.moveDrag(i, true) }}
                  >
                    {dapp.domain[0].toUpperCase() + dapp.domain[1]}
                  </div>
                )
              }
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
                  this.moveDrag(this.added.length, false)
                }
              }}
              onMouseLeave={e => {
                this.inAddedCatch = false
              }}
            />
            {this.store('main.dappMap.added').map((hash, i) => {
              const dapp = this.store(`main.dapps.${hash}`)
              const drag = this.dragging
              if (drag && drag.dapp && drag.docked === false && drag.index === i) {
                return (
                  <div key={i} className='addedApp'>
                    <div
                      className='addedAppCard'
                      style={{
                        color: dapp.color,
                        opacity: 0.3,
                        boxShadow: 'none',
                        transform: 'scale(1.4)'
                      }}
                    >
                      {dapp.domain[0].toUpperCase() + dapp.domain[1]}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div
                    key={i}
                    className='addedApp'
                    style={{ color: dapp.color }}
                    onMouseDown={e => {
                      e.persist()
                      this.enableDragTimeout = setTimeout(() => {
                        this.onMouseDownUndocked(e, dapp, i)
                      }, 200)
                    }}
                    onMouseUp={e => {
                      clearTimeout(this.enableDragTimeout)
                      if (!this.dragging) link.rpc('launchDapp', dapp.domain, (err) => { err ? console.error(err) : console.log('Dapp launched') })
                    }}
                    onMouseEnter={e => {
                      if (drag) this.moveDrag(i, false)
                    }}
                  >
                    <div className='addedAppCard'>
                      {dapp.domain[0].toUpperCase() + dapp.domain[1]}
                    </div>
                  </div>
                )
              }
            })}
          </div>
          <div className='appStoreShade' />
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
