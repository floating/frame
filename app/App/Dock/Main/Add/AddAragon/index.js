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
      error: false,
      name: ''
    }
    this.forms = [React.createRef()]
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
    if (formInput) formInput.current.blur()
  }

  focusActive () {
    setTimeout(() => {
      const formInput = this.currentForm()
      if (formInput) formInput.current.focus()
    }, 500)
  }

  next () {
    this.blurActive()
    this.setState({ index: ++this.state.index })
    this.focusActive()
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
        type: 'aragon',
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

  accountSort (a, b) {
    const accounts = this.store('main.accounts')
    a = accounts[a].created
    b = accounts[b].created
    if (a === -1 && b !== -1) return -1
    if (a !== -1 && b === -1) return 1
    if (a > b) return -1
    if (a < b) return 1
    return 0
  }

  accountFilter (id) {
    const network = this.store('main.connection.network')
    const account = this.store('main.accounts', id)
    if (account.type === 'aragon') return false
    return account.network === network
  }

  restart () {
    this.setState({ adding: false, agent: '0x0000000000000000000000000000000000000000', index: 0, name: '' })
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
        <div className='addAccountItemBar addAccountItemSmart' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemIcon'>
              <div className='addAccountItemIconType addAccountItemIconSmart' style={{ paddingTop: '6px' }}>{svg.aragon(30)}</div>
              <div className='addAccountItemIconHex addAccountItemIconHexSmart' />
            </div>
            <div className='addAccountItemTopTitle'>Aragon</div>
            <div className='addAccountItemTopTitle' />
          </div>
          <div className='addAccountItemSummary'>An Aragon smart account allows you to use your Aragon DAO with any dapp</div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionIntro' onMouseDown={() => this.adding()}>
              <div className='addAccountItemDeviceTitle'>Add Aragon Account</div>
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>enter dao name</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input tabIndex='-1' ref={this.forms[0]} value={this.state.name} onChange={e => this.onChange('name', e)} onFocus={e => this.onFocus('name', e)} onBlur={e => this.onBlur('name', e)} onKeyPress={e => { if (e.key === 'Enter') this.next() }} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>Next</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Choose acting account</div>
                  <div className='addAccountItemOptionList'>
                    {Object.keys(this.store('main.accounts'))
                      .filter(id => this.accountFilter(id))
                      .sort((a, b) => this.accountSort(a, b))
                      .map(id => {
                        const account = this.store('main.accounts', id)
                        return <div key={id} className='addAccountItemOptionListItem' onMouseDown={e => this.actorAccount(id)}>{account.name}</div>
                      })}
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Choose acting address</div>
                  <div className='addAccountItemOptionList'>
                    {(this.store('main.accounts', this.state.actorId, 'addresses') || []).map((a, i) => {
                      return (
                        <div key={a + i} className='addAccountItemOptionListItem fira' onMouseDown={e => this.actorAddress(a, i)}>
                          {a ? a.substring(0, 6) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{a ? a.substr(a.length - 4) : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                  {this.state.error ? <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>try again</div> : null}
                </div>
              </div>
            </div>
          </div>
          <div
            className='addAccountItemSummary' onMouseDown={() => {
              const net = this.store('main.connection.network')
              const open = url => this.store.notify('openExternal', { url })
              if (net === '1') return open('https://mainnet.aragon.org')
              if (net === '4') return open('https://rinkeby.aragon.org')
              return open('https://aragon.org')
            }}
          >{'Don\'t have a dao? Create one'}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddAragon)
