import React from 'react'
import Restore from 'react-restore'

import Signer from '../../../Signer'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'

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
    let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'

    let signer

    if (this.state.createdSignerId) {
      signer = this.store('main.signers', this.state.createdSignerId)
    }

    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar addAccountItemHot' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <div className='addAccountItemIconType addAccountItemIconHot'>
                  <RingIcon svgName={'seedling'} />
                </div>
                <div className='addAccountItemIconHex addAccountItemIconHexHot' />
              </div>
              <div className='addAccountItemTopTitle'>Seed Phrase</div>
            </div>
            {/* <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'DONE'}</div> */}
            <div className='addAccountItemSummary'>A phrase account uses a list of words to backup and restore your account</div>
          </div>
          <div className='addAccountItemOption'>
            <div
              className='addAccountItemOptionIntro' onMouseDown={() => {
                this.adding()
                setTimeout(() => link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'hotAccountWarning', notifyData: {} } }), 800)
              }}
            >
              Add Phrase Account
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>seed phrase</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <textarea autoFocus tabIndex='-1' value={this.state.phrase} ref={this.forms[0]} onChange={e => this.onChange('phrase', e)} onFocus={e => this.onFocus('phrase', e)} onBlur={e => this.onBlur('phrase', e)} onKeyPress={e => this.keyPress(e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>Next</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>create password</div>
                  <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
                    <div className='addAccountItemOptionSubtitle'>password must be 12 characters or longer</div>
                    <input type='password' tabIndex='-1' value={this.state.password} ref={this.forms[1]} onChange={e => this.onChange('password', e)} onFocus={e => this.onFocus('password', e)} onBlur={e => this.onBlur('password', e)} onKeyPress={e => this.keyPress(e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.create()}>Create</div>
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

export default Restore.connect(AddPhrase)
