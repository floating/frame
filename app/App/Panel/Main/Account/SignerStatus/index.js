import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

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
      expand: false,
      shake: false
    }
    this.statusRef = React.createRef()
    this.inputRef = React.createRef()
  }

  // clickListener (event) {
  //   console.log('found a clikc')
  //   const statusRef = ReactDOM.findDOMNode(this.statusRef.current)
  //   if (statusRef && statusRef.contains(event.target)) {
  //     console.log('inside statu ref')
  //     this.setState({ hideStatus: false })
  //   } else  {
  //     console.log('outside statu ref')
  //     this.setState({ hideStatus: true })
  //   }
  //   // if (!element.contains(event.target)) { // or use: event.target.closest(selector) === null
  //   //   element.style.display = 'none'
  //   //   removeClickListener()
  //   // }
  // }

  // componentDidMount () {
  //   document.addEventListener('mousedown', this.clickListener.bind(this))
  // } 

  // componentWillUnmount () {
  //   document.removeEventListener('mousedown', this.clickListener.bind(this))
  // }

  shake () {
    this.setState({ shake: true })
    setTimeout(() => {
      this.setState({ shake: false })
    }, 1200)
  }

  unlockChange (e) {
    this.setState({ unlockInput: e.target.value })
  }

  unlockSubmit (e) {
    link.rpc('unlockSigner', this.props.signer.id, this.state.unlockInput, (err) => {
      if (err) this.shake()
    })
  }

  trezorPin (num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }

  submitPin () {
    link.rpc('trezorPin', this.props.signer.id, this.state.tPin, () => {})
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

  componentDidMount () {
    setTimeout(() => {
      document.addEventListener('mousedown', (e) => {
        if (this.props.open && this.statusRef && this.statusRef.current && !this.statusRef.current.contains(e.target)) {
          this.props.hideSignerStatus(true)
        }
      })
      this.inputRef.current.focus()
    }, 100)
  }

  render () {
    const { shake } = this.state

    return this.props.signer && this.props.signer.id && this.props.signer.status === 'locked' ? (
      <div className={shake ? 'signerStatus headShake' : 'signerStatus'} ref={this.statusRef}>
        <div className='signerStatusWrap'>
          <div className='signerStatusTop'>
            <div className='signerStatusTopArrow' />
          </div>
          <div className='signerStatusMain'>
            <div className='signerUnlockWrap'>
              <div className='signerUnlockHeader'>The signer for this account is locked</div>
              <input ref={this.inputRef} className='signerUnlockInput' type='password' value={this.state.unlockInput} onChange={this.unlockChange.bind(this)} onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  this.unlockSubmit()
                }
              }} />
              <div className='signerUnlockSubmit' onClick={this.unlockSubmit.bind(this)} >{'Unlock'}</div>
            </div>
          </div>
        </div>
      </div>
    ) : null
  }
}

export default Restore.connect(SignerStatus)