import path from 'path'
import React from 'react'
import Restore from 'react-restore'
import octicons from 'octicons'

import rpc from '../../../../rpc'

import Requests from './Requests'
import Settings from './Settings'

// web3.eth.net.getNetworkType(cb)

class Signer extends React.Component {
  trezorPin (num) {
    this.tPin = this.tPin ? this.tPin + num.toString() : num.toString()
    if (this.tPin.length === 4) {
      rpc('trezorPin', this.props.id, this.tPin, (err, status) => { if (err) throw new Error(err) })
      this.tPin = ''
    }
  }
  select () {
    if (this.props.mode === 'scroll') {
      let bounds = this.signer.getBoundingClientRect()
      this.store.initialSignerPos({top: bounds.top, bottom: document.body.clientHeight - bounds.top - this.signer.clientHeight})
    }
    let current = this.store('signer.current') === this.props.id
    if (!current) {
      rpc('setSigner', this.props.id, (err, status) => {
        if (err) return console.log(err)
      })
    } else {
      rpc('unsetSigner', (err, status) => {
        if (err) return console.log(err)
      })
      // this.store.unsetSigner()
    }
  }
  render () {
    if (this.props.status === 'loading') return null
    let current = this.store('signer.current') === this.props.id
    let minimized = this.store('signer.minimized')
    this.selected = current && !minimized

    let type = this.props.type
    let signerClass = 'signer'
    let signerIndicator = 'signerIndicator'
    let signerSettings = 'signerSettingsMenu'

    if (this.store('signer.view') === 'settings') {
      signerSettings += ' signerSettingsOpen'
    } else {
      signerIndicator += ' signerIndicatorOpen'
    }

    if (this.props.status === 'ok') signerClass += ' okSigner'

    let style = {}

    if (this.props.mode === 'slide') {
      let initial = this.store('signer.position.initial')
      if (current) {
        // Slide and current
        style.position = 'absolute'
        style.top = initial.top
        style.bottom = initial.bottom
        style.left = 0
        style.right = 0
        style.transition = '0.48s cubic-bezier(.82,0,.12,1) all, 0s opacity linear, 0s transform linear'
        if (!minimized) {
          // Slide and current and open
          signerClass += ' selectedSigner'
          signerIndicator += ' signerSettingsActive'
          signerSettings += ' signerSettingsActive'
          style.top = 38
          style.bottom = 5
        }
      } else {
        // Slide and before current
        style.visibility = 'hidden'
        style.pointerEvents = 'none'
      }
    }

    if (this.store('signer.current') && this.props.mode === 'scroll' && !minimized) {
      // Scroll and open
      style.transform = 'translate(0px, 40px)'
      style.opacity = 0
      style.transitionDelay = '0.48s opacity'
      style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'
    }

    if (current && this.props.mode === 'scroll' && !minimized) {
      // Scroll and open and current
      style.opacity = 0
      style.transition = '0s all linear'
    }

    return (
      <div className={signerClass} style={style} ref={ref => { if (ref) this.signer = ref }}>
        <div className='signerWrap' style={current && this.props.mode === 'slide' ? {height: '100%'} : {}}>
          <div className='signerTop'>
            <div className={signerIndicator}>
              <div className='signerIndicatorIcon'>
                <span onClick={() => this.store.setSignerView('default')} dangerouslySetInnerHTML={{__html: octicons['pulse'].toSVG({height: 23})}} />
              </div>
            </div>
            <div onClick={() => this.store.setSignerView('settings')} className={signerSettings}>
              <div className='signerIndicatorIcon'>
                <span dangerouslySetInnerHTML={{__html: octicons['settings'].toSVG({height: 23})}} />
              </div>
            </div>
            <div className='signerType' onClick={() => { if (this.props.status === 'ok') this.select() }}>
              <div className='signerSelect'>
                <div className='signerSelectArrows'>
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                </div>
              </div>
              <div className='signerSelect' style={{left: 'auto', right: '0'}}>
                <div className='signerSelectArrows'>
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                </div>
              </div>
              <div className='signerInner'>
                <div className='signerImage'>
                  {(_ => {
                    if (type === 'Nano S') return <img src={path.join(__dirname, './ledgerLogo.png')} />
                    if (type === 'Trezor') return <img className='trezorImage' src={path.join(__dirname, './trezorLogo.png')} />
                    return <div dangerouslySetInnerHTML={{__html: octicons['zap'].toSVG({height: 31})}} />
                  })()}
                </div>
                <div className='signerText'>{type}</div>
              </div>
            </div>
          </div>
          <div className='signerMid'>
            {this.props.status === 'ok' ? (
              <div>
                <div className='signerName'>
                  <div className='signerNameText'>{'New Account'}</div>
                  <div className='signerNameEdit'>
                    <div dangerouslySetInnerHTML={{__html: octicons['pencil'].toSVG({height: 14})}} />
                  </div>
                </div>
                <div className='signerAddress'>{this.props.accounts[0]}</div>
              </div>
            ) : <div className='signerStatus'>{this.props.status}</div>}
            {this.props.mode === 'slide' && this.store('signer.view') === 'settings' ? (
              <Settings />
            ) : <Requests id={this.props.id} accounts={this.props.accounts} minimized={minimized} />}
            {type === 'Trezor' && this.props.status === 'Need Pin' ? (
              <div className='trezorPinWrap'>
                <div className='trezorPinInput'>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                    <div key={i} className='trezorPinInputButton' onClick={this.trezorPin.bind(this, i)}>
                      <div dangerouslySetInnerHTML={{__html: octicons['primitive-dot'].toSVG({height: 20})}} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Signer)
