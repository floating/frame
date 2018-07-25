import path from 'path'
import React from 'react'
import Restore from 'react-restore'
import { CSSTransitionGroup } from 'react-transition-group'

import svg from '../../../../svg'
import rpc from '../../../../rpc'

import Requests from './Requests'
import Settings from './Settings'

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      typeHover: false
    }
  }
  copyAddress (e) {
    e.preventDefault()
    e.target.select()
    document.execCommand('Copy')
    this.setState({copied: true})
    setTimeout(_ => this.setState({copied: false}), 1000)
  }
  trezorPin (num) {
    this.tPin = this.tPin ? this.tPin + num.toString() : num.toString()
    if (this.tPin.length === 4) {
      rpc('trezorPin', this.props.id, this.tPin, (err, status) => { if (err) throw new Error(err) })
      this.tPin = ''
    }
  }
  select () {
    if (this.store('signer.current') === this.props.id) {
      rpc('unsetSigner', (err, status) => { if (err) return console.log(err) })
    } else {
      let bounds = this.signer.getBoundingClientRect()
      this.props.reportScroll()
      this.store.initialSignerPos({top: bounds.top - 5, bottom: document.body.clientHeight - bounds.top - this.signer.clientHeight + 3 - 5, height: this.signer.clientHeight, index: this.props.index})
      rpc('setSigner', this.props.id, (err, status) => { if (err) return console.log(err) })
    }
  }
  renderTrezorPin (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : {height: '0px', padding: '0px 0px 0px 0px'}}>
        <div className='trezorPinInput'>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className='trezorPinInputButton' onClick={this.trezorPin.bind(this, i)}>
              {svg.octicon('primitive-dot', {height: 20})}
            </div>
          ))}
        </div>
      </div>
    )
  }
  renderArrows () {
    return (
      <React.Fragment>
        <div className='signerSelect signerSelectLeft'>
          <div className='signerSelectArrows'>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', {height: 18})}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', {height: 18})}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', {height: 18})}</div>
          </div>
        </div>
        <div className='signerSelect signerSelectRight'>
          <div className='signerSelectArrows'>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', {height: 18})}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', {height: 18})}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', {height: 18})}</div>
          </div>
        </div>
      </React.Fragment>
    )
  }
  // typeMouseEnter () {
  //   this.setState({typeHover: true})
  // }
  // typeMouseLeave () {
  //   this.setState({typeHover: false})
  // }
  // typeMouseMove (e) {
  //   let bounds = e.currentTarget.getBoundingClientRect()
  //   let {clientX, clientY} = e
  //   let deg = 20
  //   let tiltY = deg * ((((clientY - bounds.top) / (bounds.bottom - bounds.top)) * 2) - 1)
  //   let tiltX = deg * ((((clientX - bounds.left) / (bounds.right - bounds.left)) * 2) - 1)
  //   this.setState({typeHover: true, tiltX, tiltY})
  // }
  typeClick () {
    if (this.props.status === 'ok') {
      this.select()
      this.setState({typeActive: true})
      setTimeout(() => this.setState({typeActive: false}), 110)
    } else {
      this.setState({typeShake: true})
      setTimeout(() => this.setState({typeShake: false}), 1010)
    }
  }
  // onMouseMove={::this.typeMouseMove} onMouseEnter={::this.typeMouseEnter} onMouseLeave={::this.typeMouseLeave}
  renderType () {
    let innerClass = 'signerInner'
    // if (this.state.typeHover) innerClass += ' signerInnerHover'
    if (this.state.typeActive) innerClass += ' signerInnerActive'
    if (this.state.typeShake) innerClass += ' headShake'
    return (
      <div className='signerType' onMouseDown={::this.typeClick}>
        {this.renderArrows('up')}
        <div className={innerClass}>
          <div className='signerInset'>
            <div className='signerImage'>
              {(_ => {
                if (this.props.type === 'Nano S') return <img src={path.join(__dirname, './ledgerLogo.png')} />
                if (this.props.type === 'Trezor') return <img className='trezorImage' src={path.join(__dirname, './trezorLogo.png')} />
                return svg.octicon('zap', {height: 31})
              })()}
            </div>
            <div className='signerText'>{this.props.type}</div>
          </div>
        </div>
      </div>
    )
  }
  renderMenu () {
    let menuClass = 'signerMenu'
    menuClass += this.store('signer.view') === 'settings' ? ' signerMenuSettings' : ' signerMenuDefault'
    if (this.store('signer.current') === this.props.id & this.store('signer.open')) menuClass += ' signerMenuOpen'
    return (
      <div className={menuClass}>
        <div className='signerMenuItem signerMenuItemLeft' onClick={() => this.store.setSignerView('default')} >
          <div className='signerMenuItemIcon'>
            {svg.octicon('pulse', {height: 23})}
            <div className='iconUnderline' />
          </div>
        </div>
        <div className='signerMenuItem signerMenuItemRight' onClick={() => this.store.setSignerView('settings')}>
          <div className='signerMenuItemIcon'>
            {svg.octicon('settings', {height: 23})}
            <div className='iconUnderline' />
          </div>
        </div>
      </div>
    )
  }
  renderStatus () {
    // TODO: Set Signer Name
    // let current = this.store('signer.current') === this.props.id
    // let open = current && this.store('signer.open')
    // <div className={open && this.store('signer.view') === 'settings' ? 'signerName signerNameSettings' : 'signerName'}>
    return (
      <div className='signerStatusWrap'>
        <CSSTransitionGroup transitionName='standardFade' transitionEnterTimeout={320} transitionLeaveTimeout={320}>
          <div className='signerStatus' key={this.props.status}>
            {this.props.status !== 'ok' ? (
              <div className='signerStatusNotOk'>
                {this.props.status}
              </div>
            ) : (
              <React.Fragment>
                <div className='signerName'>
                  <div className='signerNameText'>
                    {this.props.type + ' Account'}
                    <div className='signerNameEdit'>{svg.octicon('pencil', {height: 18})}</div>
                  </div>
                </div>
                <div className='signerAddress'>
                  <div className='transactionToAddress'>
                    <div className='transactionToAddressLarge'>{this.props.accounts[0].substring(0, 11)} {svg.octicon('kebab-horizontal', {height: '14px'})} {this.props.accounts[0].substr(this.props.accounts[0].length - 13)}</div>
                    <div className='transactionToAddressFull'>
                      {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', {height: 10})}</span> : this.props.accounts[0]}
                      <input onClick={e => this.copyAddress(e)} defaultValue={this.props.accounts[0]} />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        </CSSTransitionGroup>
      </div>
    )
  }
  render () {
    let current = (this.store('signer.current') === this.props.id) && this.props.status === 'ok'
    let open = current && this.store('signer.open')
    let minimized = this.store('signer.minimized')
    this.selected = current && !minimized

    let signerClass = 'signer'
    if (this.props.status === 'ok') signerClass += ' okSigner'
    if (open) signerClass += ' openSigner'

    let style = {}
    let initial = this.store('signer.position.initial')

    if (current) {
      // Currently selected
      style.position = 'absolute'
      style.top = open ? 40 : initial.top
      style.bottom = open ? 3 : initial.bottom
      style.left = 0
      style.right = 0
      style.zIndex = '1000000000000'
    } else if (this.store('signer.current') !== '') {
      // Not currently selected, but another signer is
      style.opacity = 0
      style.pointerEvents = 'none'
      style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'
      if (this.store('signer.open')) {
        // Not open, but another signer is
        style.transform = this.props.index > this.store('signer.position.initial.index') ? 'translate(0px, 100px)' : 'translate(0px, -100px)'
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        style.transform = 'translate(0px, 0px)'
        style.opacity = 1
      }
    }

    return (
      <div className='signerWrap' style={current ? {height: initial.height + 'px'} : {}}>
        <div className={signerClass} style={style} ref={ref => { if (ref) this.signer = ref }}>
          <div className='signerContainer' style={current ? {height: '100%'} : {}}>
            <div className='signerTop'>
              <div className='signerNav'> {this.renderMenu()} {this.renderType()} </div>
              {this.renderStatus()}
              {this.renderTrezorPin(this.props.type === 'Trezor' && this.props.status === 'Need Pin')}
            </div>
            <div className='signerMid' style={open ? {} : {pointerEvents: 'none'}}>
              <Settings />
              <Requests id={this.props.id} accounts={this.props.accounts} minimized={minimized} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Signer)
