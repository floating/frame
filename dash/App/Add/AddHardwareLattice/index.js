import React from 'react'
import Restore from 'react-restore'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg' // TODO: get gridplus svg

import Signer from '../../Signer'

class AddHardwareLattice extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      adding: false,
      index: 0,
      status: '',
      error: false,
      deviceId: '',
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

  createLattice () {
    link.rpc('createLattice', this.state.deviceId, (err, signer) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else {
        this.setState({ status: 'Successful', error: false, createdSignerId: signer.id })
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

  render () {
    let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'
    let signer
    if (this.state.createdSignerId) {
      signer = this.store('main.signers', this.state.createdSignerId)
    }

    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <div className='addAccountItemIconType addAccountItemIconHardware'>{svg.lattice(24)}</div>
              </div>
              <div className='addAccountItemTopTitle'>Lattice</div>
            </div>
            <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{svg.close(24)}</div>
            <div className='addAccountItemSummary'>GridPlus Lattice1</div>
          </div>
          <div className='addAccountItemOption'>
            <div
              className='addAccountItemOptionSetup'
              style={{ transform: `translateX(-${100 * this.state.index}%)` }}
            >
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Enter device id</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input
                      tabIndex='-1' ref={this.forms[0]} value={this.state.deviceId}
                      onChange={e => this.onChange('deviceId', e)}
                      onFocus={e => this.onFocus('deviceId', e)}
                      onBlur={e => this.onBlur('deviceId', e)} 
                      onKeyPress={e => { 
                        if (e.key === 'Enter') {
                          this.createLattice()
                          this.next()
                        }
                      }}
                    />
                  </div>
                  <div
                    className='addAccountItemOptionSubmit'
                    onMouseDown={() => {
                      this.createLattice()
                      this.next()
                    }}
                  >Create
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  {signer ? <Signer key={signer.id} {...signer} />
                  : (
                    <>
                      <div className='phaseItemOptionTitle'>{this.state.status}</div>
                      {this.state.error ? <div className='phaseItemOptionSubmit' onMouseDown={() => this.restart()}>try again</div> : null}
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

export default Restore.connect(AddHardwareLattice)
