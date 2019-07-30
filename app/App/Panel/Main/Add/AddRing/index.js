import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'
import svg from '../../../../../svg'

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
      privateKey: '',
      keystore: '',
      keystorePassword: ''
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
    this.setState({ index: ++this.state.index })
  }

  createManual () {
    this.setState({ index: ++this.state.index })
    link.rpc('createFromPrivateKey', this.state.privateKey, this.state.password, (err, signer) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else {
        this.setState({ status: 'Successful', error: false })
        setTimeout(() => {
          this.store.toggleAddAccount()
        }, 2000)
      }
    })
  }

  createKeystore () {
    this.setState({ index: ++this.state.index })
    link.rpc('createFromKeystore', this.state.keystore, this.state.keystorePassword, this.state.password, (err, signer) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else {
        this.setState({ status: 'Successful', error: false })
        setTimeout(() => {
          this.store.toggleAddAccount()
        }, 2000)
      }
    })
  }

  restart () {
    this.setState({ index: 0, adding: true, phrase: '', password: '', status: '', success: false })
  }

  addManual () {
    this.setState({ mode: 'manual' })
    this.next()
  }

  addKeystore () {
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

  render () {
    let itemClass = 'addAccountItem addAccountItemSmart'
    if (this.state.adding) itemClass += ' addAccountItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar addAccountItemHot' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconHot' style={{ marginTop: '2px' }}>{svg.octicon('key', { height: 23 })}</div>
              <div className='addAccountItemIconHex addAccountItemIconHexHot' />
            </div>
            <div className='addAccountItemTopTitle'>{'Keyring'}</div>
            <div className='addAccountItemTopTitle'>{''}</div>
          </div>
          <div className='addAccountItemSummary'>{'A keyring account lets you to add individual private keys to an account'}</div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionIntro' onMouseDown={() => { this.setState({ adding: true }) }}>
              {'Add Keyring Account'}
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'Add Private Key'}</div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.addManual()}>{'Enter Manually'}</div>
                  <div className='addAccountItemOptionSubmit' style={{ marginTop: '10px' }} onMouseDown={() => this.addKeystore()}>{'Use Keystore.json'}</div>
                </div>
                {this.state.mode === 'manual' ? (
                  <React.Fragment>
                    <div className='addAccountItemOptionSetupFrame'>
                      <div className='addAccountItemOptionTitle'>{'Enter Private Key'}</div>
                      <div className='addAccountItemOptionInputPhrase'>
                        <input type='password' tabIndex={'-1'} value={this.state.privateKey} onChange={e => this.onChange('privateKey', e)} onFocus={e => this.onFocus('privateKey', e)} onBlur={e => this.onBlur('privateKey', e)} />
                      </div>
                      <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>{'Next'}</div>
                    </div>
                    <div className='addAccountItemOptionSetupFrame'>
                      <div className='addAccountItemOptionTitle'>{'Create Password'}</div>
                      <div className='addAccountItemOptionInputPhrase'>
                        <input type='password' tabIndex={'-1'} value={this.state.password} onChange={e => this.onChange('password', e)} onFocus={e => this.onFocus('password', e)} onBlur={e => this.onBlur('password', e)} />
                      </div>
                      <div className='addAccountItemOptionSubmit' onMouseDown={() => this.createManual()}>{'Create'}</div>
                    </div>
                    <div className='addAccountItemOptionSetupFrame'>
                      <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                      {this.state.error ? <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>{'try again'}</div> : null}
                    </div>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <div className='addAccountItemOptionSetupFrame'>
                      <div className='addAccountItemOptionTitle'>{'Locating Keystore'}</div>
                    </div>
                    <div className='addAccountItemOptionSetupFrame'>
                      <div className='addAccountItemOptionTitle'>{'Enter Keystore Password'}</div>
                      <div className='addAccountItemOptionInputPhrase'>
                        <input type='password' tabIndex={'-1'} value={this.state.keystorePassword} onChange={e => this.onChange('keystorePassword', e)} onFocus={e => this.onFocus('keystorePassword', e)} onBlur={e => this.onBlur('keystorePassword', e)} />
                      </div>
                      <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>{'Next'}</div>
                    </div>
                    <div className='addAccountItemOptionSetupFrame'>
                      <div className='addAccountItemOptionTitle'>{'Create Account Password'}</div>
                      <div className='addAccountItemOptionInputPhrase'>
                        <input type='password' tabIndex={'-1'} value={this.state.password} onChange={e => this.onChange('password', e)} onFocus={e => this.onFocus('password', e)} onBlur={e => this.onBlur('password', e)} />
                      </div>
                      <div className='addAccountItemOptionSubmit' onMouseDown={() => this.createKeystore()}>{'Create'}</div>
                    </div>
                    <div className='addAccountItemOptionSetupFrame'>
                      <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                      {this.state.error ? <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>{'try again'}</div> : null}
                    </div>
                  </React.Fragment>
                )}
              </div>
            </div>
          </div>
          <div className='addAccountItemSummary'>{'-'}</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddRing)
