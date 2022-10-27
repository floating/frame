import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../resources/link'
import RingIcon from '../../../../../resources/Components/RingIcon'

class AddAddress extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      index: 0,
      adding: false,
      address: '',
      password: '',
      status: '',
      error: false
    }
    this.forms = [React.createRef(), React.createRef()]
  }

  onChange (key, e) {
    e.preventDefault()
    const update = {}
    const value = (e.target.value || '')
    // value = value === ' ' ? '' : value
    // value = value.replace(/[ \t]+/g, '_')
    // value = value.replace(/\W/g, '')
    // value = value.replace(/_/g, ' ')
    // value = value.split(' ').length > 24 ? value.substring(0, value.lastIndexOf(' ') + 1) : value // Limit to 24 words max
    update[key] = value
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
    this.focusActive()
  }

  create () {
    this.setState({ index: ++this.state.index })
    link.rpc('createFromAddress', this.state.address, 'Watch Account', (err) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else {
        this.setState({ status: 'Successful', error: false })
      }
    })
  }

  restart () {
    this.setState({ index: 0, adding: false, address: '', password: '', success: false })
    setTimeout(() => {
      this.setState({ status: '', error: false })
    }, 500)
    this.focusActive()
  }

  keyPress (e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const formInput = this.forms[this.state.index]
      if (formInput) formInput.current.blur()
      if (this.state.index === 1) return this.create()
      this.next()
    }
  }

  adding () {
    this.setState({ adding: true })
    this.focusActive()
  }

  focusActive () {
    setTimeout(() => {
      const formInput = this.forms[this.state.index]
      if (formInput) formInput.current.focus()
    }, 500)
  }

  render () {
    let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar addAccountItemMock' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <RingIcon svgName={'mask'} svgSize={24} />
              </div>
              <div className='addAccountItemTopTitle'>Watch Account</div>
            </div>
            {/* <div className='addAccountItemClose' onClick={() => this.props.close()}>{'Done'}</div> */}
            <div className='addAccountItemSummary'>Watch accounts work like normal accounts but cannot sign</div>
          </div>
          <div className='addAccountItemOption'>
            <div
              className='addAccountItemOptionIntro' onClick={() => {
                this.adding()
              }}
            >
              Add Address Account
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>input address</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <textarea tabIndex='-1' value={this.state.address} ref={this.forms[0]} onChange={e => this.onChange('address', e)} onFocus={e => this.onFocus('address', e)} onBlur={e => this.onBlur('address', e)} onKeyPress={e => this.keyPress(e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onClick={() => this.create()}>Create</div>
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

export default Restore.connect(AddAddress)
