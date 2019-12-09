import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../../svg'
import link from '../../../../../link'
// Signer disconnected
// Signer locked
// Signer ready
//   let innerClass = 'signerInner'
//   if (this.state.typeActive) innerClass += ' signerInnerActive'
//   if (this.state.typeShake) innerClass += ' headShake'
//   if (this.store('selected.view') === 'settings') innerClass += ' signerTypeSettings'
//   if (!this.props.signer || (this.props.signer && this.props.signer.status === 'initial')) innerClass += ' signerInnerDisconnected'
//   const inSettings = this.store('selected.view') === 'settings'
//   return (
//     <div className='signerType'>
//       <div
//         className='addressSelect'
//         onMouseDown={e => {
//           e.stopPropagation()
//           this.store.toggleShowAccounts()
//         }}
//       >
//         <div className='addressSelectButton'>
//           <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
//           <div className='addressSelectText'>Addresses</div>
//           <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
//         </div>
//       </div>
//       {!this.props.signer || (this.props.signer && this.props.signer.status === 'initial') ? (
//         <div className='signerTypeDisconnected' onMouseDown={::this.typeClick} style={inSettings ? { transform: 'translateY(-30px)' } : {}} onMouseEnter={() => this.setState({ openHover: true })} onMouseLeave={() => this.setState({ openHover: false })}>
//           <div className='signerTypeDisconnectedImageFront'>{svg.logo(24)}</div>
//         </div>
//       ) : null}
//       <div className={innerClass} onMouseDown={::this.typeClick} onMouseEnter={() => this.setState({ openHover: true })} onMouseLeave={() => this.setState({ openHover: false })}>
//         <div className='signerInset'>
//           <div className='signerImage'>
//             {(_ => {
//               if (this.props.signer) {
//                 if (this.props.signer.type === 'ledger') return <img src={ledgerLogo} />
//                 if (this.props.signer.type === 'trezor') return <img className='trezorImage' src={trezorLogo} />
//                 if (this.props.signer.type === 'seed' || this.props.signer.type === 'ring') return svg.flame(21)
//                 if (this.props.signer.type === 'aragon') return svg.aragon(32)
//                 return svg.octicon('plus', { height: 31 })
//               } else {
//                 return null
//               }
//             })()}
//           </div>
//         </div>
//       </div>
//     </div>

// TODO: Rename Signer component to Account

class Status extends React.Component {
  constructor (...args) {
    super(...args)
    // console.log(this.props)
    this.state = {
      minimized: false,
      unlockInput: '',
      unlockHeadShake: false,
      expandSigner: false
    }
    this.unlockInput = React.createRef()
  }

  handleSignerToggle (e) {
    e.preventDefault()
    e.stopPropagation()
    this.setState({ expandSigner: !this.state.expandSigner })
  }

  unlockChange (e) {
    this.setState({ unlockInput: e.target.value })
  }

  unlockSubmit (e) {
    link.rpc('unlockSigner', this.props.signer.id, this.state.unlockInput, (err, result) => {
      if (err) {
        this.setState({ unlockHeadShake: true })
        setTimeout(() => this.setState({ unlockHeadShake: false }), 1010)
      }
    })
  }

  keyPressUnlock (e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      this.unlockSubmit()
    }
  }

  render () {
    // Signer disconnected
    // Signer locked
    // Signer ready

    //   let innerClass = 'signerInner'
    //   if (this.state.typeActive) innerClass += ' signerInnerActive'
    //   if (this.state.typeShake) innerClass += ' headShake'
    //   if (this.store('selected.view') === 'settings') innerClass += ' signerTypeSettings'
    //   if (!this.props.signer || (this.props.signer && this.props.signer.status === 'initial')) innerClass += ' signerInnerDisconnected'
    //   const inSettings = this.store('selected.view') === 'settings'
    let status
    console.log(this.props.signer)
    if (!this.props.signer || (this.props.signer && this.props.signer.status === 'initial')) {
      status = 'disconnected'
    } else {
      status = this.props.signer.status
    }
    console.log('signer status', status)
    const statusClass = this.state.expandSigner ? 'accountStatus accountStatusOpen' : 'accountStatus'
    const statusOpen = !this.state.expandSigner ? ::this.handleSignerToggle : null

    const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const open = current && this.store('selected.open')
    // let minimized = this.store('selected.minimized')

    let unlockClass = 'signerUnlockRequest'
    if (this.state.unlockHeadShake) unlockClass += ' headShake'
    const unlockStyle = open && this.props.signer && this.props.signer.status === 'locked' ? { opacity: 1, height: '110px', transfrom: 'translateY(0px)' } : { pointerEvents: 'none', transfrom: 'translateY(0px)', height: '0px', opacity: 0.3 }

    return (
      <div className={statusClass} onMouseDown={statusOpen}>
        {status === 'locked' ? (
          <div className='accountStatusInner'>
            <div className='accountStatusIndicator'>
              {svg.octicon('shield', { height: 18 })}
            </div>
            <div className='accountStatusTitle'>
              Signer is locked
            </div>
            <div className='accountStatusClose' onMouseDown={::this.handleSignerToggle}>
              {'x'}
            </div>
            <div>
              <div className={unlockClass} style={unlockStyle}>
                <div className='signerUnlockWrap'>
                  <input className='signerUnlockInput' ref={this.unlockInput} type='password' value={this.state.unlockInput} onChange={::this.unlockChange} onKeyPress={e => this.keyPressUnlock(e)} />
                  <div className='signerUnlockSubmit' onMouseDown={::this.unlockSubmit}>Unlock</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {status === 'disconnected' ? (
          <div className='accountStatusInner'>
            <div className='accountStatusIndicator'>
              {svg.unlink(16)}
            </div>
            <div className='accountStatusTitle'>
              Signer is disconnected
            </div>
            <div className='accountStatusClose' onMouseDown={::this.handleSignerToggle}>
              {'x'}
            </div>
          </div>
        ) : null}
        {status === 'ok' ? (
          <div className='accountStatusInner'>
            <div className='accountStatusIndicator'>
              {svg.fingerprint(16)}
            </div>
            <div className='accountStatusTitle'>
              Signer is ready!
            </div>
            <div className='accountStatusClose' onMouseDown={::this.handleSignerToggle}>
              {'x'}
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Status)
