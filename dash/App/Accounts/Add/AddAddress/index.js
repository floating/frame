import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../resources/link'
import RingIcon from '../../../../../resources/Components/RingIcon'

const isEnsName = input => input.toLowerCase().includes('.eth')

class AddAddress extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      index: 0,
      adding: false,
      address: '',
      status: '',
      error: false
    }

    this.forms = [React.createRef(), React.createRef()]
    this.cancelEnsResolution = () => {}
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

  nextForm () {
    this.setState({ index: this.state.index + 1 })
  }

  next () {
    this.nextForm()
    this.focusActive()
  }

  async resolveEnsName (name) {
    return new Promise((resolve, reject) => {
      this.cancelEnsResolution = () => reject('User canceled ENS resolution request for watch account')

      link.rpc('resolveEnsName', name, (err, resolvedAddress) => {
        if (err || !resolvedAddress) {
          const message = `Unable to resolve Ethereum address for ${name}`
          this.setError(message)
          reject(message)
        }

        resolve(resolvedAddress)

        this.nextForm()
      })
    })
  }

  setError (status) {
    this.setState({ status, error: true })
  }

  createFromAddress (address) {
    link.rpc('createFromAddress', address, 'Watch Account', (err) => {
      if (err) {
        this.setError(err)
      } else {
        this.setState({ status: 'Successful', error: false })
      }
    })
  }

  async create () {
    const { address: input } = this.state

    if (!isEnsName(input)) {
      this.setState({ index: this.state.index + 2 })
      return this.createFromAddress(input)
    }

    this.nextForm()

    try {
      const resolvedAddress = await this.resolveEnsName(input)
      this.createFromAddress(resolvedAddress)
    } catch (e) {
      console.log(e)
    }
  }

  restart () {
    this.cancelEnsResolution()
    this.setState({ index: 0, adding: false, address: '', success: false })

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
      if (this.state.index === 0) return this.create()
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
    const { status, error, address, index: formIndex } = this.state

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
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * formIndex}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <label htmlFor='addressInput' role='label' className='addAccountItemOptionTitle'>input address or ENS name</label>
                  <div className='addAccountItemOptionInputPhrase'>
                    <textarea id='addressInput' tabIndex='-1' value={address} ref={this.forms[0]} onChange={e => this.onChange('address', e)} onFocus={e => this.onFocus('address', e)} onBlur={e => this.onBlur('address', e)} onKeyPress={e => this.keyPress(e)} />
                  </div>
                  <div role='button' className='addAccountItemOptionSubmit' onClick={() => this.create()}>Create</div>
                </div>

                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountResolvingEns'>
                    <div className='addAccountItemOptionTitle'>Resolving ENS Name</div>
                    <div className='signerLoading'>
                      <div className='signerLoadingLoader' />
                    </div>
                    <div className='addAccountItemOptionSubmit' onClick={() => this.restart()}>back</div>
                  </div>
                </div>

                <div className='addAccountItemOptionSetupFrame'>
                  {error
                    ? <>
                      <div className='addAccountItemOptionTitle'>{status}</div>
                      <div className='addAccountItemOptionSubmit' onClick={() => this.restart()}>try again</div>
                     </>
                    : <>
                      <div className='addAccountItemOptionTitle'>{'account added successfully'}</div>
                      <div className='addAccountItemOptionSubmit' onClick={() => link.send('nav:back', 'dash', 2)}>back</div>
                    </>
                  }
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
