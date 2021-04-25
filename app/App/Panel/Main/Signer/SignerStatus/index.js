import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../svg'

class SignerStatus extends React.Component {
  constructor (...args) {
    super(...args)
    // this.moduleRef = React.createRef()
    // this.resizeObserver = new ResizeObserver(() => {
    //   if (this.moduleRef && this.moduleRef.current) {
    //     link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
    //   }
    // })
    this.state = {
      expand: false
    }
  }
  // componentDidMount () {
  //   this.resizeObserver.observe(this.moduleRef.current)
  // } 
  unlockChange (e) {
    this.setState({ unlockInput: e.target.value })
  }

  unlockSubmit (e) {
    link.rpc('unlockSigner', this.props.signer, this.state.unlockInput, () => {})
  }

  trezorPin (num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }

  submitPin () {
    link.rpc('trezorPin', this.props.signer, this.state.tPin, () => {})
    this.setState({ tPin: '' })
  }

  backspacePin (e) {
    e.stopPropagation()
    this.setState({ tPin: this.state.tPin ? this.state.tPin.slice(0, -1) : '' })
  }

  renderTrezorPin (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        <div className='trezorPinInput'>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
              {svg.octicon('primitive-dot', { height: 20 })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  render () {
    const signer = this.props.signer ? this.store('main.signers', this.props.signer) : null
    // signer.status === 'locked'
    // console.log('signer, signer.status', signer, signer.status)
    return signer ? (
      <div>
        <div className={this.props.open && signer && signer.status === 'locked' ? 'signerStatus' : 'signerStatus signerStatusHidden' }>
          <div className='signerStatusTop'>
          <div className='signerStatusTopArrow' />
          </div>
          <div className='signerStatusMain'>
            <div className='signerUnlockWrap'>
              <div className='signerUnlockHeader'>The signer for this account is locked</div>
              <input className='signerUnlockInput' type='password' value={this.state.unlockInput} onChange={this.unlockChange.bind(this)} />
              <div className='signerUnlockSubmit' onMouseDown={this.unlockSubmit.bind(this)} >{'Unlock'}</div>
            </div>
          </div>
        </div> 
      </div>
    ) : null
  }
}

export default Restore.connect(SignerStatus)