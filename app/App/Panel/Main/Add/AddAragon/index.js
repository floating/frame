import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'
import svg from '../../../../../svg'

class AddAragon extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      adding: false,
      agent: '0x0000000000000000000000000000000000000000',
      index: 0,
      status: '',
      error: false
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

  actorAccount (actorId) {
    this.setState({ actorId })
    this.next()
  }

  capitalize (s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  actorAddress (actorAddress, actorIndex) {
    link.rpc('resolveAragonName', this.state.name, (err, dao) => {
      this.next()
      if (err) return this.setState({ status: err, error: true })
      const aragonAccount = {
        id: dao.apps.kernel.proxyAddress,
        index: 0,
        addresses: [dao.apps.agent.proxyAddress], // Agent Address
        type: 'Aragon',
        name: this.capitalize(dao.name) + ' DAO',
        ens: dao.ens,
        network: dao.network,
        smart: {
          type: 'aragon',
          actor: { // Reference to Frame account that will act on behalf of the agent
            id: this.state.actorId,
            index: actorIndex,
            address: actorAddress // External Signer
          },
          dao: dao.apps.kernel.proxyAddress, // DAO Address
          agent: dao.apps.agent.proxyAddress // Agent Address
        }
      }
      link.rpc('addAragon', aragonAccount, (err) => {
        if (err) {
          this.setState({ status: err, error: true })
        } else {
          this.setState({ status: 'Successful', error: false })
          setTimeout(() => {
            this.store.toggleAddAccount()
          }, 2000)
        }
      })
    })
  }

  restart () {
    this.setState({ index: 0, adding: true, phrase: '', password: '', status: 'creating signers', success: false })
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
                  <div className='addAccountItemOptionTitle'>{'enter dao name'}</div>
                  <div className='addAccountItemOptionInput'>
                    <textarea tabIndex={'-1'} value={this.state.name} onChange={e => this.onChange('name', e)} onFocus={e => this.onFocus('name', e)} onBlur={e => this.onBlur('name', e)} />
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
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                  {this.state.error ? <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>{'try again'}</div> : null}
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
