import path from 'path'
import React from 'react'
import Restore from 'react-restore'
import octicons from 'octicons'

import rpc from '../../../rpc'

import Requests from './Requests'

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {minimized: true}
  }
  trezorPin (num) {
    this.tPin = this.tPin ? this.tPin + num.toString() : num.toString()
    if (this.tPin.length === 4) {
      rpc('trezorPin', this.props.id, this.tPin, (err, status) => {
        if (err) throw new Error(err)
      })
      this.tPin = ''
    }
  }
  select () {
    this.setState({minimized: !this.state.minimized})
    let current = this.store('signer.current') === this.props.id
    if (!current) {
      rpc('setSigner', this.props.id, (err, status) => {
        if (err) return console.log(err)
        // Signer Change Success
      })
    }
  }
  render () {
    let current = this.store('signer.current') === this.props.id
    this.selected = current && !this.state.minimized
    let type = this.props.type
    let signerClass = current ? 'signer signer.current' : 'signer'
    if (this.selected) signerClass += ' selectedSigner'
    if (this.props.status === 'ok') signerClass += ' okSigner'
    if (this.props.status === 'loading') return null
    return (
      <div className={signerClass}>
        <div className='signerWrap'>
          <div className='signerTop'>
            <div className='signerType' onClick={() => { if (this.props.status === 'ok') this.select() }}>
              <div className='signerImage'>
                {(_ => {
                  if (type === 'Nano S') return <img src={path.join(__dirname, './ledgerLogo.png')} />
                  if (type === 'Trezor') return <img className='trezorImage' src={path.join(__dirname, './trezorLogo.png')} />
                  return <div dangerouslySetInnerHTML={{__html: octicons['zap'].toSVG({height: 31})}} />
                })()}
              </div>
              <div className='signerText'>{type}</div>
              <div className='signerSelect'>
                <div className='signerSelectArrows'>
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                  <div className='signerSelectArrow' dangerouslySetInnerHTML={{__html: octicons['chevron-up'].toSVG({height: 18})}} />
                </div>
              </div>
            </div>
          </div>
          <div className='signerMid'>
            {this.props.status === 'ok' ? (
              <div>
                <div className='signerName'>{'Account Name'}</div>
                <div className='signerAddress'>{this.props.accounts}</div>
              </div>
            ) : <div className='signerStatus'>{this.props.status}</div>}
            <Requests id={this.props.id} accounts={this.props.accounts} minimized={this.state.minimized} status={this.props.status} type={this.props.type} />
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
