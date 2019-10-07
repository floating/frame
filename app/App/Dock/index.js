import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

// import DevTools from 'restore-devtools'
// <DevTools />

const Dapp = ({ domain, pinned }) => {
  const handleClick = (e) => {
    if (e.button === 2) return link.rpc('removeDapp', domain, (err) => { err ? console.error(err) : console.log('Dapp removed') })
    if (!pinned) return window.alert('Dapp not pinned yet')
    link.rpc('launchDapp', domain, (err) => { err ? console.error(err) : console.log('Dapp launched') })
  }
  const classNames = pinned ? 'dockAppIcon' : 'dockAppIcon dockAppIconNotPinned'
  return (
    <div className={classNames} onMouseDown={handleClick}>{svg.aragon(40)}</div>
  )
}

const randomColor = () => {
  const v = (f, c) => Math.round(Math.random() * (c - f)) + f
  return `rgb(${v(40, 200)}, ${v(90, 140)}, ${v(90, 210)})`
}

class Dock extends React.Component {
  constructor (...args) {
    super(...args)
    this.addAppFill = 'Enter ENS Domain'
    this.state = {
      ensInput: this.addAppFill,
      pendingRemoval: false
    }
    this.undocked = (Array.from(Array(50).keys())).map(i => {
      return {
        color: randomColor(),
        docked: false
      }
    })
    this.docked = (Array.from(Array(8).keys())).map(i => {
      return {
        color: randomColor(),
        docked: true
      }
    })
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

  moveDrag (dapp, index) {
    const drag = this.dragging
    const removeFrom = drag.dapp.docked ? this.docked : this.undocked
    removeFrom.splice(drag.index, 1)
    const addTo = dapp.docked ? this.docked : this.undocked
    this.dragging.index = index
    this.dragging.dapp.docked = dapp.docked
    addTo.splice(index, 0, drag.dapp)
    this.forceUpdate()
  }

  releaseDrag = () => {
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
    this.dragging = { dapp, index }
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
    this.dragging = { dapp, index }
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
    const expanded = this.store('dock.expand')
    let transform = open ? 'translate3d(-425px, 0px, 0px)' : 'translate3d(0px, 0px, 0px)'
    if (expanded) transform = 'translate3d(-718px, 0px, 0px)'
    const transition = '0.32s cubic-bezier(.82,0,.12,1) all'
    const transitionDelay = expanded ? '0s' : open ? '0s' : '0s'
    const dapps = Object.keys(this.store('main.dapps')).map((key) => this.store(`main.dapps.${key}`))
    return (
      <div id='dock' style={{ transform, transition, transitionDelay }}>
        <div className='appMovement'>
          {this.dragging ? (
            <div
              className='draggedApp'
              style={{
                top: this.currentTop,
                left: this.currentLeft,
                color: this.dragging.dapp.color
              }}
            >
              <div className='draggedAppCard'>
                {svg.aragon(28)}
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
                {svg.trash(18)}
              </div>
            </div>
          ) : (
            <div className='addAppForm'>
              <div className='addAppInput'>
                <input value={this.state.ensInput} onFocus={::this.handleOnFocus} onBlur={::this.handleOnBlur} onChange={e => this.setState({ ensInput: e.target.value })} />
              </div>
              <div className='addAppSubmit' onMouseDown={::this.handleAddApp}>Add App</div>
            </div>
          )}
          <div className='dockApps' style={{ marginTop: `-${(this.docked.length * 48) / 2}px` }}>
            {dapps.map((dapp, i) => {
              return <Dapp key={dapp.domain + i} {...dapp} />
            })}
            {this.docked.map((dapp, i) => {
              const drag = this.dragging
              if (drag && drag.dapp && drag.dapp.docked === dapp.docked && drag.index === i) {
                return (
                  <div
                    key={i}
                    className='dockedApp'
                    style={{ color: dapp.color }}
                  >
                    <div style={{ opacity: 0.3 }}>{svg.aragon(28)}</div>
                  </div>
                )
              } else {
                return (
                  <div
                    key={i}
                    className='dockedApp'
                    style={{ color: dapp.color }}
                    onMouseDown={e => this.onMouseDownDocked(e, dapp, i)}
                    onMouseEnter={e => { if (drag) this.moveDrag(dapp, i) }}
                  >
                    {svg.aragon(28)}
                  </div>
                )
              }
            })}
            {this.docked.length === 0 && this.dragging ? (
              <div
                className='dockedHolder'
                onMouseEnter={e => { this.moveDrag({ docked: true }, 0) }}
              />
            ) : null}
          </div>
          <div className='addedApps'>
            {this.undocked.map((dapp, i) => {
              const drag = this.dragging
              if (drag && drag.dapp && drag.dapp.docked === dapp.docked && drag.index === i) {
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
                      {svg.aragon(28)}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div
                    key={i}
                    className='addedApp'
                    style={{ color: dapp.color }}
                    onMouseDown={e => this.onMouseDownUndocked(e, dapp, i)}
                    onMouseEnter={e => { if (drag) this.moveDrag(dapp, i) }}
                  >
                    <div className='addedAppCard'>
                      {svg.aragon(28)}
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
