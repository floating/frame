import React from 'react'
import Restore from 'react-restore'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg' // TODO: get gridplus svg

class AddHardwareLattice extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      adding: false,
      index: 0,
      status: '',
      error: false,
      deviceID: '',
      pairCode: ''
    }
    this.forms = [React.createRef(), React.createRef(), React.createRef()]
  }

  onChange (key, e) {
    e.preventDefault()
    const update = {}
    update[key] = (e.target.value || '') // .replace(/\W/g, '')
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

  currentForm () {
    return this.forms[this.state.index]
  }

  blurActive () {
    const formInput = this.currentForm()
    if (formInput && formInput.current) formInput.current.blur()
  }

  focusActive () {
    setTimeout(() => {
      const formInput = this.currentForm()
      if (formInput && formInput.current) formInput.current.focus()
    }, 500)
  }

  next () {
    this.blurActive()
    this.setState({ index: ++this.state.index })
    this.focusActive()
  }

  connectToLattice () {
    link.rpc('latticeConnect', {
      deviceID: this.state.deviceID
    }, (err, response = []) => {
      if (err || !response || response.length === 0) {
        return this.setState({ status: err, index: 2, error: true })
      }
      const [accounts, isPaired] = response
      if (!isPaired) {
        this.next()
        this.setState({ status: 'Pairing Device', error: false })
      } else if (accounts && accounts.length > 0) {
        this.setState({ status: 'Adding Accounts', index: 2, error: false })
        setTimeout(() => {
          this.store.toggleAddAccount()
        }, 1000)
      } else if (!err && isPaired === typeof 'undefined') {
        this.setState({ status: 'ok', index: 2, error: true })
      }
    })
  }

  pairToLattice () {
    this.next()
    link.rpc('latticePair', this.state.deviceID, this.state.pairCode, (err, accounts) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else if (accounts.length > 0) {
        this.setState({ status: 'Adding Accounts', index: 2, error: false })
        setTimeout(() => {
          this.store.toggleAddAccount()
        }, 2000)
      }
    })
  }

  capitalize (s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  restart () {
    this.setState({ adding: false, index: 0, pairCode: '' })
    setTimeout(() => {
      this.setState({ status: '', error: false })
    }, 500)
    this.focusActive()
  }

  adding () {
    this.setState({ adding: true })
    this.focusActive()
  }

  render () {
    let itemClass = 'addAccountItem addAccountItemSmart'
    if (this.state.adding) itemClass += ' addAccountItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemIcon'>
              <div
                className='addAccountItemIconType addAccountItemIconSmart'
                style={{ paddingTop: '6px' }}
              >{svg.lattice(32)}
              </div>
              <div className='addAccountItemIconHex addAccountItemIconHexSmart' />
            </div>
            <div className='addAccountItemTopTitle'>Lattice</div>
            <div className='addAccountItemTopTitle' />
          </div>
          <div className='addAccountItemSummary'>Unlock your Lattice to get started</div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionIntro' onMouseDown={() => this.adding()}>
              <div className='addAccountItemDeviceTitle'>Add Lattice</div>
            </div>
            <div
              className='addAccountItemOptionSetup'
              style={{ transform: `translateX(-${100 * this.state.index}%)` }}
            >
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>enter device id</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input
                      tabIndex='-1' ref={this.forms[0]} value={this.state.deviceID}
                      onChange={e => this.onChange('deviceID', e)}
                      onFocus={e => this.onFocus('deviceID', e)}
                      onBlur={e => this.onBlur('deviceID', e)} onKeyPress={e => {
                        if (e.key === 'Enter') this.connectToLattice()
                      }}
                    />
                  </div>
                  <div
                    className='addAccountItemOptionSubmit'
                    onMouseDown={() => this.connectToLattice()}
                  >Next
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>enter generated passcode</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input
                      tabIndex='1' ref={this.forms[1]} value={this.state.pairCode}
                      onChange={e => this.onChange('pairCode', e)}
                      onFocus={e => this.onFocus('pairCode', e)}
                      onBlur={e => this.onBlur('pairCode', e)} onKeyPress={e => {
                        if (e.key === 'Enter') this.pairToLattice()
                      }}
                    />
                  </div>
                  <div
                    className='addAccountItemOptionSubmit'
                    onMouseDown={() => this.pairToLattice()}
                  >Pair
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                  {this.state.error ? (
                    <div
                      className='addAccountItemOptionSubmit'
                      onMouseDown={() => this.restart()}
                    >
                      try again
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddHardwareLattice)
