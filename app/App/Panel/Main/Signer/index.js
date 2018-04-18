import path from 'path'
import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'
import rpc from '../../../../rpc'

import Requests from './Requests'
import Settings from './Settings'

// web3.eth.net.getNetworkType(cb)

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      typeHover: false
    }
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
      this.store.initialSignerPos({top: bounds.top, bottom: document.body.clientHeight - bounds.top - this.signer.clientHeight, height: this.signer.clientHeight, index: this.props.index})
      rpc('setSigner', this.props.id, (err, status) => { if (err) return console.log(err) })
    }
  }
  renderTrezorPin () {
    return (
      <div className='trezorPinWrap'>
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
  typeMouseEnter () {
    this.setState({typeHover: true})
  }
  typeMouseLeave () {
    this.setState({typeHover: false})
  }
  typeMouseMove (e) {
    let bounds = e.currentTarget.getBoundingClientRect()
    let {clientX, clientY} = e
    this.setState({glowLeft: clientX - bounds.left, glowTop: clientY - bounds.top})
  }
  typeClick () {
    if (this.props.status === 'ok' && this.state.typeHover) this.select()
  }
  renderType () {
    let left = this.store('signer.current') === this.props.id && this.store('signer.open') ? 0 : 25
    let right = this.store('signer.current') === this.props.id && this.store('signer.open') ? 0 : 25
    let typeClass = 'signerType'
    return (
      <div className={typeClass} onClick={::this.typeClick} onMouseMove={::this.typeMouseMove} onMouseEnter={::this.typeMouseEnter} onMouseLeave={::this.typeMouseLeave}>
        {this.renderArrows('up')}
        <div className='signerInner' style={{left, right}}>
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
  render () {
    if (this.props.status === 'loading') return null
    let current = this.store('signer.current') === this.props.id
    let open = current && this.store('signer.open')
    let minimized = this.store('signer.minimized')
    this.selected = current && !minimized

    let signerClass = 'signer'
    if (this.props.status === 'ok') signerClass += ' okSigner'
    if (open) signerClass += ' openSigner'

    let style = {}
    let initial = this.store('signer.position.initial')

    if (current) {
      style.position = 'absolute'
      style.top = open ? 40 : initial.top
      style.bottom = open ? 5 : initial.bottom
      style.left = 0
      style.right = 0
      style.zIndex = '1000000'
    } else if (this.store('signer.current') !== '') {
      style.opacity = 0
      style.pointerEvents = 'none'
      style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'
      if (this.store('signer.open')) {
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
              {this.props.status !== 'ok' ? <div className='signerStatus'>{this.props.status}</div> : (
                <div>
                  <div className={open && this.store('signer.view') === 'settings' ? 'signerName signerNameSettings' : 'signerName'}>
                    <div className='signerNameText'>
                      {'Account Name ' + this.props.index}
                      <div className='signerNameEdit'>{svg.octicon('pencil', {height: 18})}</div>
                    </div>
                  </div>
                  <div className='signerAddress'>{this.props.accounts[0]}</div>
                </div>
              )}
              {this.props.type === 'Trezor' && this.props.status === 'Need Pin' ? this.renderTrezorPin() : null}
            </div>
            <div className='signerMid'>
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
