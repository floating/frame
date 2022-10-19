import React from 'react'
import Restore from 'react-restore'
import ob from 'urbit-ob'
import log from 'electron-log'


import Signer from '../../Signer'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

class AddUrbitID extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      index: 0,
      adding: false,
      ship: '',
      ticket: '',
      status: '',
      error: false
    }
    this.forms = [React.createRef(), React.createRef()]
  }

  onChange (key, e) {
    e.preventDefault()
    const update = {}
    const value = (e.target.value || '')
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

  async create () {
    this.setState({ index: ++this.state.index })

    const ship = this.state.ship.trim()
    const ticket = this.state.ticket.trim();

    let point
    try {
      point = ob.patp2dec(ship)
    } catch {
      return this.setState({
        status: `${ship} is not a valid @p`,
        error: true
      })
    }

    try {
      ob.patq2dec(ticket)
    } catch {
      return this.setState({
        status: `${ticket} is not a valid @q`,
        error: true,
      })
    }

    log.info('Deriving Ownership Wallet...')
    this.setState({ status: 'Deriving...' })
    link.rpc('createFromMasterTicket', point, ticket, (error, signer) => {
      if (error) {
        log.error('Error deriving Ownership Wallet', error)
        this.setState({
          status: `Unable to derive Ownership Wallet due to mismatched ship or ticket.`,
          error: true
        })
      } else {
        this.setState({ status: 'Successful', error: false, createdSignerId: signer.id })
      }
    })
  }

  restart () {
    this.setState({ index: 0, adding: false, ship: '', ticket: '', success: false })
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
                <div className='addAccountItemIconType addAccountItemIconHot'>{svg.wallet(18)}</div>
                <div className='addAccountItemIconHex addAccountItemIconHexHot' />
              </div>
              <div className='addAccountItemTopTitle'>Urbit ID</div>
            </div>
            <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'DONE'}</div>
            <div className='addAccountItemSummary'>Urbit ID is a decentralized addressing and public key infrastructure designed for Urbit OS. Learn more at urbit.org</div>
          </div>
          <div className='addAccountItemOption'>
            <div
              className='addAccountItemOptionIntro' onMouseDown={() => {
                this.adding()
                setTimeout(() => this.store.notify('hotAccountWarning'), 800)
              }}
            >
              Add Urbit ID
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Ship Name</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input type='text' tabIndex='-1' value={this.state.ship} ref={this.forms[0]} onChange={e => this.onChange('ship', e)} onFocus={e => this.onFocus('ship', e)} onBlur={e => this.onBlur('ship', e)} onKeyPress={e => this.keyPress(e)} placeholder="~sampel-palnet" />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>Next</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Master Ticket</div>
                  <div className='addAccountItemOptionInputPhrase addAccountItemOptionInputPassword'>
                    <textarea type='text' tabIndex='-1' value={this.state.ticket} ref={this.forms[1]} onChange={e => this.onChange('ticket', e)} onFocus={e => this.onFocus('ticket', e)} onBlur={e => this.onBlur('ticket', e)} onKeyPress={e => this.keyPress(e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.create()}>Create</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  {signer ? <Signer key={signer.id} {...signer} inSetup={true} />
                  : (
                    <>
                      <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                      {this.state.error ? <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>try again</div> : null}
                    </>
                  )}
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

export default Restore.connect(AddUrbitID)
