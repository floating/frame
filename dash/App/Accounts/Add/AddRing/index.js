import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'


class AddRing extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      index: 0,
      adding: false,
      password: '',
      status: '',
      error: false,
      mode: 'manual',
      privateKey: ''
    }
    this.forms = {
      enterPrivateKey: React.createRef(),
      manualCreatePassword: React.createRef()
    }
  }

  onChange (key, e) {
    e.preventDefault()
    const update = {}
    update[key] = e.target.value || ''
    this.setState(update)
  }

  onBlur (key, e) {
    e.preventDefault()
    const update = {}
    update[key] = this.state[key] || ''
    this.setState(update)
  }

  onFocus (key, e) {
    e.preventDefault()
    if (this.state[key] === '') {
      const update = {}
      update[key] = ''
      this.setState(update)
    }
  }

  next () {
    this.blurActive()
    this.setState({ index: ++this.state.index })
    this.focusActive()
  }

  createManual () {
    this.next()
    link.rpc('createFromPrivateKey', this.state.privateKey, this.state.password, (err, signer) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else {
        // reset nav state to before the start of the flow and open the new signer
        link.send('tray:action', 'backDash', 2)
        const crumb = {
          view: 'expandedSigner', 
          data: { signer: signer.id }
        }
        link.send('tray:action', 'navDash', crumb)
      }
    })
  }

  restart () {
    this.setState({ index: 0, adding: false, password: '', mode: 'manual', privateKey: '' })
    setTimeout(() => {
      this.setState({ status: '', error: false })
    }, 500)
    this.focusActive()
  }

  keyPress (e, next) {
    if (e.key === 'Enter') {
      e.preventDefault()
      next()
    }
  }

  adding () {
    this.setState({ adding: true })
  }

  blurActive () {
    const formInput = this.currentForm()
    if (formInput) formInput.current.blur()
  }

  focusActive () {
    setTimeout(() => {
      const formInput = this.currentForm()
      if (formInput) formInput.current.focus()
    }, 500)
  }

  currentForm () {
    let current
    if (this.state.index === 0) current = this.forms.enterPrivateKey
    if (this.state.index === 1) current = this.forms.manualCreatePassword
    return current
  }

  render () {
    let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar addAccountItemHot' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <div className='addAccountItemIconType addAccountItemIconHot'>
                  <RingIcon svgName={'key'} />
                </div>
                <div className='addAccountItemIconHex addAccountItemIconHexHot' />
              </div>
              <div className='addAccountItemTopTitle'>Private Key</div>
            </div>
            {/* <div className='addAccountItemClose' onClick={() => this.props.close()}>{'DONE'}</div> */}
            <div className='addAccountItemSummary'>A private key account lets you add accounts from individual private keys</div>
          </div>
          <div className='addAccountItemOption'>
            <div
              className='addAccountItemOptionIntro' onClick={() => {
                this.adding()
                setTimeout(() => {
                  link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'hotAccountWarning', notifyData: {} } })
                }, 800)
              }}
            >
              Add Keyring Account
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Enter Private Key</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input autoFocus type='password' tabIndex='-1' ref={this.forms.enterPrivateKey} value={this.state.privateKey} onChange={e => this.onChange('privateKey', e)} onFocus={e => this.onFocus('privateKey', e)} onBlur={e => this.onBlur('privateKey', e)} onKeyPress={e => this.keyPress(e, () => this.next())} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onClick={() => this.next()}>Next</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Create Password</div>
                  <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
                    <div className='addAccountItemOptionSubtitle'>password must be 12 characters or longer</div>
                    <input type='password' tabIndex='-1' ref={this.forms.manualCreatePassword} value={this.state.password} onChange={e => this.onChange('password', e)} onFocus={e => this.onFocus('password', e)} onBlur={e => this.onBlur('password', e)} onKeyPress={e => this.keyPress(e, () => this.createManual())} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onClick={() => this.createManual()}>Create</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                  {this.state.error ? <div className='addAccountItemOptionSubmit' onClick={() => this.restart()}>try again</div> : null}
                </div>
              </div>
            </div>
          </div>
          <div className='addAccountItemFooter' />
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddRing)
