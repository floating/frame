import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'
import { isHardwareSigner } from '../../../../resources/domain/signer'

class SignerStatus extends React.Component {
  constructor(...args) {
    super(...args)
    // this.moduleRef = React.createRef()
    // this.resizeObserver = new ResizeObserver(() => {
    //   if (this.moduleRef && this.moduleRef.current) {
    //     link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
    //   }
    // })
    this.state = {
      expand: false,
      shake: false
    }
    this.statusRef = React.createRef()
    this.inputRef = React.createRef()
  }

  shake() {
    this.setState({ shake: true })
    setTimeout(() => {
      this.setState({ shake: false })
    }, 1200)
  }

  unlockChange(e) {
    this.setState({ unlockInput: e.target.value })
  }

  unlockSubmit(e) {
    link.rpc('unlockSigner', this.props.signer.id, this.state.unlockInput, (err) => {
      if (err) this.shake()
    })
  }

  trezorPin(num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }

  submitPin() {
    link.rpc('trezorPin', this.props.signer.id, this.state.tPin, () => {})
    this.setState({ tPin: '' })
  }

  backspacePin(e) {
    e.stopPropagation()
    this.setState({ tPin: this.state.tPin ? this.state.tPin.slice(0, -1) : '' })
  }

  renderTrezorPin(active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        <div className='trezorPinInput'>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
              {svg.octicon('primitive-dot', { height: 20 })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // componentDidMount () {
  //   setTimeout(() => {
  //     document.addEventListener('mousedown', (e) => {
  //       if (this.props.open && this.statusRef && this.statusRef.current && !this.statusRef.current.contains(e.target)) {
  //         this.props.setSignerStatusOpen(false)
  //       }
  //     })
  //     if (this.inputRef.current) {
  //       this.inputRef.current.focus()
  //     }
  //   }, 100)
  // }

  render() {
    const { shake } = this.state

    const signer = this.props.signer || {}

    return !isHardwareSigner(signer) && signer.id && signer.status === 'locked' ? (
      <div className={shake ? 'signerStatus headShake' : 'signerStatus'} ref={this.statusRef}>
        <div className='signerStatusWrap'>
          <div className='signerStatusMain'>
            <div className='signerUnlockWrap'>
              <input
                autoFocus={true}
                ref={this.inputRef}
                className='signerUnlockInput'
                type='password'
                value={this.state.unlockInput}
                onChange={this.unlockChange.bind(this)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    this.unlockSubmit()
                  }
                }}
              />
              <div className='signerUnlockInputLabel'>{'Enter password to unlock'}</div>
              <div className='signerUnlockSubmit' onClick={this.unlockSubmit.bind(this)}>
                {'Unlock'}
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null
  }
}

export default Restore.connect(SignerStatus)
