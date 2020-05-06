import React from 'react'
import Restore from 'react-restore'

import svg from '../../../svg'
import link from '../../../link'

import AppTile from './AppTile'

class AddDapp extends React.Component {
  constructor (...args) {
    super(...args)
    this.addAppFill = 'Enter ENS Name'
    this.state = {
      ensInput: this.addAppFill,
      expanded: false
    }
  }

  handleAddApp () {
    if (this.state.ensInput === '' || this.state.ensInput === this.addAppFill) return
    const domain = this.state.ensInput
    const options = {}
    this.setState({ pending: 'add', pendingMessage: 'Installing ' + domain, ensInput: this.addAppFill })
    const cb = (err) => {
      if (err) {
        console.log(err)
        this.setState({ pending: 'error', pendingMessage: err })
        setTimeout(() => {
          this.setState({ pending: '', pendingMessage: '' })
        }, 3000)
      } else {
        this.setState({ pending: '', pendingMessage: '' })
      }
    }
    link.rpc('addDapp', domain, options, cb)
    // if (this.dappInput) this.dappInput.blur()
    // this.setState({ ensInput: this.addAppFill })
  }

  handleOnFocus () {
    if (this.state.ensInput === this.addAppFill) this.setState({ ensInput: '' })
  }

  handleOnBlur () {
    if (this.state.ensInput === '') this.setState({ ensInput: this.addAppFill })
  }
  render () {
    let addDappClass = this.state.expanded ? 'dockCardAddDapp dockCardAddDappExpanded' : 'dockCardAddDapp'
    return (
      <>
        <div className='addAppButton' onMouseDown={() => {
          this.setState({ expanded: !this.state.expanded })
        }}>
          {'Add +'}
        </div>
        <div className={addDappClass}>
          <div className='addAppButton' onMouseDown={() => {
            this.setState({ expanded: !this.state.expanded })
          }}>
            {'Add +'}
          </div>
          {this.state.pending ? (
            <div className='addAppForm'>
              {this.state.pendingMessage}
            </div>
          ) : (
            this.dragging ? (
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
                    ref={c => { this.dappInput = c }}
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
                  <div className='addAppSubmitButton'>+</div>
                </div>
              </div>
            )
          )}
        </div>
      </>
    )
  }
}

class Dapps extends React.Component {
  constructor (...args) {
    super(...args)
    this.addAppFill = 'Enter ENS Name'
    this.state = {
      ensInput: this.addAppFill,
      pending: '',
      pendingRemoval: false,
      pendingAdd: false
    }
    this.added = []
    this.docked = []
    this.inDockCatch = false
    this.inAddedCatch = false
    this.context.store.observer(() => {
      const open = this.context.store('tray.open')
      this.context.store('tray.dockOnly') // Rerun
      this.context.store('dock.expand') // Rerun
      this.delayDock = open && this._open !== open
      this._open = open
    })
  }

  handleToggleDock () {
    const cb = (err) => { err ? console.error(err) : console.log('toggleDock') }
    link.rpc('toggleDock', cb)
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
    if (this.store('selected.card') !== 'dapps') return
    this.dragging = { dapp, index, docked }
    const parent = e.target.offsetParent
    const offsetTop = parent.offsetTop
    const offsetLeft = parent.offsetLeft
    if (docked) {
      this.initialTop = this.currentTop = e.target.offsetTop + offsetTop - 10
      this.initialLeft = this.currentLeft = e.target.offsetLeft + offsetLeft - 10
    } else {
      const scrollTop = parent.scrollTop
      this.initialTop = this.currentTop = e.target.offsetTop - scrollTop + offsetTop + 50
      this.initialLeft = this.currentLeft = e.target.offsetLeft + offsetLeft + 50
    }
    this.topBound = parent.offsetParent.clientHeight
    this.leftBound = parent.offsetParent.clientWidth
    this.initialY = e.pageY
    this.initialX = e.pageX
    this.forceUpdate()
    window.addEventListener('mousemove', this.tabDrag)
    window.addEventListener('mouseup', this.releaseDrag)
  }

  render () {
    const current = this.store('selected.card') === 'dapps' && !this.store('tray.dockOnly') && this.store('tray.open')
    const dockCardClass = current ? 'dockCard cardShow' : 'dockCard cardHide'
    // const style = current ? { transform: 'translate3d(0px, 0px, 0px)' } : { transform: 'translate3d(370px, 0px, 0px)' }
    const ipfsReady = this.store('main.clients.ipfs.state') === 'ready'

    const dockStyle = { marginTop: `-${(this.store('main.dapp.map.docked').length * 48) / 2}px` }
    if (this.store('view.addAccount')) {
      dockStyle.opacity = 0
      dockStyle.pointerEvents = 'none'
    }
    return (
      <>
        <div className='appMovement'>
          {this.dragging ? (
            <div
              className={this.state.dragHeadShake ? 'draggedApp headshake' : 'draggedApp'}
              style={{ top: this.currentTop, left: this.currentLeft }}
            >
              <div className='draggedAppCard'>
                <AppTile moving dragging={this.dragging} cid={this.dragging.dapp.cid} />
              </div>
            </div>
          ) : null}
        </div>
        <div
          className='dragCatchDock'
          onMouseMove={e => {
            if (this.inDockCatch) return
            const drag = this.dragging
            if (drag && !drag.docked) {
              this.inDockCatch = true
              const before = e.clientY < (e.target.clientHeight / 2)
              this.moveDrag(before ? 0 : this.store('main.dapp.map.docked').length, true)
            }
          }}
          onMouseLeave={e => {
            this.inDockCatch = false
          }}
        />
        <div className='appsOff' style={ipfsReady ? { display: 'none' } : {}}>
          {'NO IPFS CONNECTION'}
        </div>
        {ipfsReady ? (
          <div className='dockApps' style={dockStyle}>
            {this.store('main.dapp.map.docked').map((hash, i) => {
              return (
                <AppTile
                  key={hash}
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
        ) : null}
        <div className={dockCardClass}>
          <div className='dockCardInset'>
            <div className='appStore'>
              <AddDapp />
              <div className='dockCardHeader'>
                <div className='dockCardHeaderLeft'>
                  <div className='dockCardHeaderTitle'> 
                    {'Apps'}
                  </div>
                </div>
              </div>
              <div className='addedApps'>
                <div
                  className='dragCatch'
                  onMouseMove={e => {
                    if (this.inAddedCatch) return
                    const drag = this.dragging
                    if (drag && drag.docked) {
                      this.inAddedCatch = true
                      this.moveDrag(this.store('main.dapp.map.added').length, false)
                    }
                  }}
                  onMouseLeave={e => { this.inAddedCatch = false }}
                />
                {this.store('main.dapp.map.added').map((hash, i) => {
                  return (
                    <AppTile
                      key={hash}
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
              <div className='browserExtension'>
                <div className='browserExtensionText browserExtensionBot'>
                  <div>Use Frame with dapps in your browser too!</div>
                </div>
                <div className='browserExtensionIcons'>
                  <div className='browserExtensionIcon' onMouseDown={() => link.send('tray:openExternal', 'https://chrome.google.com/webstore/detail/frame/ldcoohedfbjoobcadoglnnmmfbdlmmhf')}>{svg.chrome(22)}</div>
                  <div className='browserExtensionIcon' onMouseDown={() => link.send('tray:openExternal', 'https://addons.mozilla.org/en-US/firefox/addon/frame-extension')}>{svg.firefox(22)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default Restore.connect(Dapps)
