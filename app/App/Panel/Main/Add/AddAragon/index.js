import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'
import svg from '../../../../../svg'

class AddAragon extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      adding: false,
      dao: '0x0000000000000000000000000000000000000000',
      agent: '0x0000000000000000000000000000000000000000',
      index: 0
    }
  }

  onChange (key, e) {
    e.preventDefault()
    const update = {}
    update[key] = (e.target.value || '').replace(/\W/g, '')
    this.setState(update)
  }

  onBlur (key, e) {
    e.preventDefault()
    const update = {}
    update[key] = this.state[key] || '0x0000000000000000000000000000000000000000'
    this.setState(update)
  }

  onFocus (key, e) {
    e.preventDefault()
    if (this.state[key] === '0x0000000000000000000000000000000000000000') {
      const update = {}
      update[key] = ''
      this.setState(update)
    }
  }

  next () {
    this.setState({ index: ++this.state.index })
  }

  actorAccount (actorId) {
    this.setState({ actorId })
    this.next()
  }

  actorAddress (actorAddress, actorIndex) {
    const aragonAccount = {
      id: this.state.dao,
      index: 0,
      addresses: [this.state.agent], // Agent Address
      type: 'Aragon',
      smart: {
        type: 'aragon',
        actor: { // Reference to Frame account that will act on behalf of the agent
          id: this.state.actorId,
          index: actorIndex,
          address: actorAddress // External Signer
        },
        dao: this.state.dao, // DAO Address
        agent: this.state.agent // Agent Address
      }
    }
    link.rpc('addAragon', aragonAccount, () => {
      this.store.toggleAddAccount()
    })
  }

  render () {
    let itemClass = 'addAccountItem addAccountItemSmart'
    if (this.state.adding) itemClass += ' addAccountItemAdding'
    return (
      <div className={itemClass} style={{ transitionDelay: (0.64 * this.props.index / 4) + 's' }}>
        <div className='addAccountItemBar addAccountItemSmart' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconSmart'>{svg.aragon(30)}</div>
              <div className='addAccountItemIconHex addAccountItemIconHexSmart' />
            </div>
            <div className='addAccountItemTopTitle'>{'Aragon'}</div>
            <div className='addAccountItemTopTitle'>{''}</div>
          </div>
          <div className='addAccountItemSummary'>{'An Aragon smart account allows you to use your Aragon DAO with any dapp'}</div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionIntro' onMouseDown={() => { this.setState({ adding: true }) }}>
              <div className='addAccountItemDeviceTitle'>{'Add Aragon Account'}</div>
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'dao address'}</div>
                  <div className='addAccountItemOptionInput'>
                    <textarea tabIndex={'-1'} maxLength='42' value={this.state.dao} onChange={e => this.onChange('dao', e)} onFocus={e => this.onFocus('dao', e)} onBlur={e => this.onBlur('dao', e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>{'Next'}</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'dao\'s agent address'}</div>
                  <div className='addAccountItemOptionInput'>
                    <textarea tabIndex={'-1'}maxLength='42' value={this.state.agent} onChange={e => this.onChange('agent', e)} onFocus={e => this.onFocus('agent', e)} onBlur={e => this.onBlur('agent', e)} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>{'Next'}</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'Choose acting account'}</div>
                  <div className='addAccountItemOptionList'>
                    {Object.keys(this.store('main.accounts')).map(id => {
                      const account = this.store('main.accounts', id)
                      return <div key={id} className='addAccountItemOptionListItem' onMouseDown={e => this.actorAccount(id)}>{account.type + ' Account'}</div>
                    })}
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{'Choose acting address'}</div>
                  <div className='addAccountItemOptionList'>
                    {(this.store('main.accounts', this.state.actorId, 'addresses') || []).map((a, i) => {
                      return (
                        <div key={a + i} className='addAccountItemOptionListItem fira' onMouseDown={e => this.actorAddress(a, i)}>
                          {a ? a.substring(0, 10) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{a ? a.substr(a.length - 10) : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='addAccountItemSummary'>{'Don\'t have a dao? Create one'}</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddAragon)
