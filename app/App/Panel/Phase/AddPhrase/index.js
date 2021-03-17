import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../resources/link'
import svg from '../../../../../svg'

class AddPhrase extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      index: 0,
      adding: false,
      phrase: '',
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
    link.rpc('createFromPhrase', this.state.phrase, this.state.password, (err, signer) => {
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
    this.setState({ index: 0, adding: false, phrase: '', password: '', success: false })
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
    let itemClass = 'phaseItem phaseItemSmart'
    if (this.state.adding) itemClass += ' phaseItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='phaseItemBar phaseItemHot' />
        <div className='phaseItemWrap'>
          <div className='phaseItemTop'>
            <div className='phaseItemIcon'>
              <div className='phaseItemIconType phaseItemIconHot'>{svg.quote(18)}</div>
              <div className='phaseItemIconHex phaseItemIconHexHot' />
            </div>
            <div className='phaseItemTopTitle'>Phrase</div>
            <div className='phaseItemTopTitle' />
          </div>
          <div className='phaseItemSummary'>A phrase account uses a list of words to backup and restore your account</div>
          <div className='phaseItemOption'>
            <div
              className='phaseItemOptionIntro' onMouseDown={() => {
                this.adding()
                if (this.store('main.currentNetwork.id') === '1') setTimeout(() => this.store.notify('hotAccountWarning'), 800)
              }}
            >
              Add Phrase Account
            </div>
            <div className='phaseItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='phaseItemOptionSetupFrames'>
                <div className='phaseItemOptionSetupFrame'>
                  <div className='phaseItemOptionTitle'>seed phrase</div>
                  <div className='phaseItemOptionInputPhrase'>
                    <textarea tabIndex='-1' value={this.state.phrase} ref={this.forms[0]} onChange={e => this.onChange('phrase', e)} onFocus={e => this.onFocus('phrase', e)} onBlur={e => this.onBlur('phrase', e)} onKeyPress={e => this.keyPress(e)} />
                  </div>
                  <div className='phaseItemOptionSubmit' onMouseDown={() => this.next()}>Next</div>
                </div>
                <div className='phaseItemOptionSetupFrame'>
                  <div className='phaseItemOptionTitle'>create password</div>
                  <div className='phaseItemOptionInputPhrase phaseItemOptionInputPassword'>
                    <div className='phaseItemOptionSubtitle'>password must be 12 characters or longer</div>
                    <input type='password' tabIndex='-1' value={this.state.password} ref={this.forms[1]} onChange={e => this.onChange('password', e)} onFocus={e => this.onFocus('password', e)} onBlur={e => this.onBlur('password', e)} onKeyPress={e => this.keyPress(e)} />
                  </div>
                  <div className='phaseItemOptionSubmit' onMouseDown={() => this.create()}>Create</div>
                </div>
                <div className='phaseItemOptionSetupFrame'>
                  <div className='phaseItemOptionTitle'>{this.state.status}</div>
                  {this.state.error ? <div className='phaseItemOptionSubmit' onMouseDown={() => this.restart()}>try again</div> : null}
                </div>
              </div>
            </div>
          </div>
          <div className='phaseItemSummary' />
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddPhrase)
