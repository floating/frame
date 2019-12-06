import React from 'react'
import Restore from 'react-restore'
import svg from '../../svg'
import link from '../../link'

import AppTile from './AppTile'
import Main from './Main'
import Local from './Local'

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

class _Dapps extends React.Component {
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
    const current = this.store('selected.card') === 'dapps'
    const dockCardClass = current ? 'dockCard cardShow' : 'dockCard cardHide'
    // const style = current ? { transform: 'translate3d(0px, 0px, 0px)' } : { transform: 'translate3d(370px, 0px, 0px)' }
    const ipfsReady = this.store('main.clients.ipfs.state') === 'ready'
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
          <div className='dockApps' style={{ marginTop: `-${(this.store('main.dapp.map.docked').length * 48) / 2}px` }}>
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

const Dapps = Restore.connect(_Dapps)

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
    const indicatorStyle = { top: '60px' }
    if (this.store('selected.card') === 'dapps') indicatorStyle.top = '93px'
    if (this.store('selected.card') === 'local') indicatorStyle.top = '126px'
    return (
      <div id='dock'>
        <div className='dockInset'>
          <div className={this.store('view.addAccount') ? 'panelMenu panelMenuAddMode' : 'panelMenu'}>
            <div className='panelDetail'>
              <div className='panelDetailIndicator'>
                <div className='panelDetailIndicatorShade'>
                  {this.indicator(this.store('main.connection'))}
                </div>
              </div>
              <div className='panelDetailText'>{networks[this.store('main.connection.network')]}</div>
            </div>
          </div>
          <div className='dockVanish' style={this.store('view.addAccount') ? { pointerEvents: 'none', opacity: 0 } : null}>
            <div className='dockMenuIndicator' style={indicatorStyle}>
              <div className='dockMenuIndicatorRight'>{svg.roundedTri(8)}</div>
            </div>
            <div className='expandFrame' onMouseDown={() => this.store.setCard('default')}>{svg.logo(14)}</div>
            <div className='expandFrame selectDapps' onMouseDown={() => this.store.setCard('dapps')}>{svg.apps(14)}</div>
            <div className='expandFrame selectSettings' onMouseDown={() => this.store.setCard('local')}>{svg.octicon('settings', { height: 18 })}</div>
            <div className={this.store('main.pin') ? 'pinFrame pinFrameActive' : 'pinFrame'} onMouseDown={() => link.send('tray:pin')}>{svg.thumbtack(11)}</div>
          </div>
          <Main />
          <Dapps />
          <Card name='local' />
        </div>
      </div>
    )
  }
}

export default Restore.connect(Dock)
