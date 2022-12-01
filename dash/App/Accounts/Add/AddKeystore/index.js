import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'

class AddRing extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      index: 0,
      adding: false,
      password: '',
      status: '',
      error: false,
      mode: this.props.mode ? this.props.mode : 'manual',
      keystore: '',
      keystorePassword: '',
    }
    this.forms = {
      keystorePassword: React.createRef(),
      keystoreCreatePassword: React.createRef(),
    }
  }

  onChange(key, e) {
    e.preventDefault()
    const update = {}
    update[key] = e.target.value || ''
    this.setState(update)
  }

  onBlur(key, e) {
    e.preventDefault()
    const update = {}
    update[key] = this.state[key] || ''
    this.setState(update)
  }

  onFocus(key, e) {
    e.preventDefault()
    if (this.state[key] === '') {
      const update = {}
      update[key] = ''
      this.setState(update)
    }
  }

  next() {
    this.blurActive()
    this.setState({ index: ++this.state.index })
    this.focusActive()
  }

  createKeystore() {
    this.next()
    link.rpc(
      'createFromKeystore',
      this.state.keystore,
      this.state.keystorePassword,
      this.state.password,
      (err, signer) => {
        if (err) {
          this.setState({ status: err, error: true })
        } else {
          // reset nav state to before the start of the flow and open the new signer
          link.send('tray:action', 'backDash', 2)
          const crumb = {
            view: 'expandedSigner',
            data: { signer: signer.id },
          }
          link.send('tray:action', 'navDash', crumb)
        }
      }
    )
  }

  addKeystore() {
    this.setState({ mode: 'keystore' })
    this.next()
    setTimeout(() => {
      link.rpc('locateKeystore', (err, keystore) => {
        if (err) {
          this.setState({ keystore: '', error: err })
        } else {
          this.setState({ keystore })
          this.next()
        }
      })
    }, 640)
  }

  restart() {
    this.setState({
      index: 1,
      adding: false,
      password: '',
      mode: 'manual',
      privateKey: '',
      keystore: '',
      keystorePassword: '',
    })
    setTimeout(() => {
      this.setState({ status: '', error: false })
    }, 500)
    this.focusActive()
  }

  keyPress(e, next) {
    if (e.key === 'Enter') {
      e.preventDefault()
      next()
    }
  }

  adding() {
    this.setState({ adding: true })
  }

  blurActive() {
    const formInput = this.currentForm()
    if (formInput) formInput.current.blur()
  }

  focusActive() {
    setTimeout(() => {
      const formInput = this.currentForm()
      if (formInput) formInput.current.focus()
    }, 500)
  }

  currentForm() {
    let current
    if (this.state.index === 2) current = this.forms.keystorePassword
    if (this.state.index === 3) current = this.forms.keystoreCreatePassword
    return current
  }

  render() {
    let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index) / 4 + 's' }}>
        <div className='addAccountItemBar addAccountItemHot' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <div className='addAccountItemIconType addAccountItemIconHot'>
                  <RingIcon svgName={'file'} />
                </div>
                <div className='addAccountItemIconHex addAccountItemIconHexHot' />
              </div>
              <div className='addAccountItemTopTitle'>Keystore</div>
            </div>
            {/* <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'Done'}</div> */}
            <div className='addAccountItemSummary'>
              A keystore account lets you add accounts from your keystore.json file
            </div>
          </div>
          <div className='addAccountItemOption'>
            <div
              className='addAccountItemOptionIntro'
              onMouseDown={() => {
                this.adding()
                setTimeout(() => {
                  link.send('tray:action', 'navDash', {
                    view: 'notify',
                    data: { notify: 'hotAccountWarning', notifyData: {} },
                  })
                }, 800)
              }}
            >
              Add Keyring Account
            </div>
            <div
              className='addAccountItemOptionSetup'
              style={{ transform: `translateX(-${100 * this.state.index}%)` }}
            >
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Add Keystore File</div>
                  <div
                    className='addAccountItemOptionSubmit'
                    style={{ marginTop: '10px' }}
                    onMouseDown={() => this.addKeystore()}
                  >
                    Locate Keystore File (json)
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Locating Keystore</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Enter Keystore Password</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input
                      type='password'
                      tabIndex='-1'
                      ref={this.forms.keystorePassword}
                      value={this.state.keystorePassword}
                      onChange={(e) => this.onChange('keystorePassword', e)}
                      onFocus={(e) => this.onFocus('keystorePassword', e)}
                      onBlur={(e) => this.onBlur('keystorePassword', e)}
                      onKeyPress={(e) => this.keyPress(e, () => this.next())}
                    />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>
                    Next
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Create Account Password</div>
                  <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
                    <div className='addAccountItemOptionSubtitle'>
                      password must be 12 characters or longer
                    </div>
                    <input
                      type='password'
                      tabIndex='-1'
                      ref={this.forms.keystoreCreatePassword}
                      value={this.state.password}
                      onChange={(e) => this.onChange('password', e)}
                      onFocus={(e) => this.onFocus('password', e)}
                      onBlur={(e) => this.onBlur('password', e)}
                      onKeyPress={(e) => this.keyPress(e, () => this.createKeystore())}
                    />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.createKeystore()}>
                    Create
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                  {this.state.error ? (
                    <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>
                      try again
                    </div>
                  ) : null}
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
