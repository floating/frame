import React from 'react'
import Restore from 'react-restore'

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      minimized: false,
      unlockInput: '',
      unlockHeadShake: false
    }
    this.unlockInput = React.createRef()
  }

  componentDidMount () {
    setTimeout(() => {
      const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
      const open = current && this.store('selected.open')
      if (open && this.props.signer && this.props.signer.status === 'locked' && this.unlockInput) {
        this.unlockInput.current.focus()
      }
    }, 100)
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
    let unlockClass = 'signerUnlockRequest'
    if (this.state.unlockHeadShake) unlockClass += ' headShake'
    const current = (this.store('selected.current') === this.props.accountId) && this.props.status === 'ok'
    const open = current && this.store('selected.open')
    console.log(':::::SIGNER:::::::')
    console.log('open', open)
    console.log('this.props.signer', this.props.signer)
    console.log(`this.props.signer.status === 'locked'`, this.props.signer.status)
    const unlockStyle = open && this.props.signer && this.props.signer.status === 'locked' ? { opacity: 1, height: '100px', transfrom: 'translateY(0px)' } : { pointerEvents: 'none', transfrom: 'translateY(0px)', height: '0px', opacity: 0.3 }
    return (
      <div className={unlockClass} style={unlockStyle}>
        <div className='signerUnlockWrap'>
          <input 
            className='signerUnlockInput'
            ref={this.unlockInput} 
            type='password' 
            value={this.state.unlockInput} 
            onChange={this.unlockChange.bind(this)} 
            onKeyPress={e => this.keyPressUnlock(e)} 
          />
          <div 
            className='signerUnlockSubmit' 
            onMouseDown={this.unlockSubmit.bind(this)}
          >
            Unlock
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Signer)