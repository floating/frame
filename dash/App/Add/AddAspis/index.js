import React from 'react'
import Restore from 'react-restore'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

class AddAspis extends React.Component {
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

  // actorAccount (actorId) {
  //   this.setState({ actorId })
  //   this.next()
  // }

  capitalize (s) {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  actorAccount (actorAddress) {
    link.rpc('resolveAspisAddress', this.state.name, (err, dao) => {
      this.next()
      if (err) return this.setState({ status: err, error: true })
      const aspisAccount = {
        address: dao.apps.agent.proxyAddress, // Agent Address
        type: 'aspis',
        name: dao.name,
        smart: {
          type: 'aspis',
          actor: actorAddress, // Reference to Frame account that will act on behalf of the agent
          dao: dao.apps.kernel.proxyAddress, // DAO Address
          agent: dao.apps.agent.proxyAddress // Agent Address
        }
      }
      link.rpc('addAspis', aspisAccount, (err) => {
        if (err) {
          this.setState({ status: err, error: true })
        } else {
          this.setState({ status: 'Successful', error: false })
          setTimeout(() => {
            this.props.close()
          }, 2000)
        }
      })
    })
  }

  accountSort (a, b) {
    const accounts = this.store('main.accounts')
    try {
      let [aBlock, aLocal] = accounts[a].created.split(':')
      let [bBlock, bLocal] = accounts[b].created.split(':')
  
      aLocal = parseInt(aLocal)
      bLocal = parseInt(bLocal)
  
      if (aBlock === 'new' && bBlock !== 'new') return -1
      if (bBlock !== 'new' && aBlock === 'new') return 1
      if (aBlock === 'new' && bBlock === 'new') return aLocal >= bLocal ? 1 : 0
  
      aBlock = parseInt(aBlock)
      bBlock = parseInt(bBlock)
  
      if (aBlock > bBlock) return -1
      if (aBlock < bBlock) return -1
      if (aBlock === bBlock) return aLocal >= bLocal ? 1 : 0

      return 0
    } catch (e) {
      log.error(e)
      return 0
    }
  }

  accountFilter (id) {
    // Need to migrate accounts to use network type
    // const network = this.store('main.currentNetwork.id')
    const account = this.store('main.accounts', id)
    if (account.type === 'aragon') return false
    return true 
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
    let itemClass = 'addAccountItem addAccountItemSmart addAccountItemAdding'
    return (
      <div className={itemClass}>
        <div className='addAccountItemBar addAccountItemSmart' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <div className='addAccountItemIconType addAccountItemIconSmart' style={{ paddingTop: '6px' }}>{svg.aspis(30)}</div>
              </div>
              <div className='addAccountItemTopTitle'>Aspis DAO</div>
            </div>
            <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'Done'}</div>
            <div className='addAccountItemSummary'>ASPIS allows you to use your ASPIS DAO with any dapp</div>
          </div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionIntro' onMouseDown={() => this.adding()}>
              <div className='addAccountItemDeviceTitle'>Add Aspis Dao</div>
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>enter dao address</div>
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
                        return <div key={id} className='addAccountItemOptionListItem' onMouseDown={e => this.actorAccount(id)}>
                          <div className='actingAccountAddress'>{id ? id.substring(0, 8) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{id ? id.substr(id.length - 6) : ''}</div>
                          <div className='actingAccountTag'>{account.name}</div>
                        </div>
                      })}
                  </div>
                </div>
                {/* <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Choose acting address</div>
                  <div className='addAccountItemOptionList'>
                    {(this.store('main.accounts', this.state.actorId, 'addresses') || []).map((a, i) => {
                      return (
                        <div key={a + i} className='addAccountItemOptionListItem fira' onMouseDown={e => this.actorAddress(a, i)}>
                          {a ? a.substring(0, 10) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{a ? a.substr(a.length - 10) : ''}
                        </div>
                      )
                    })}
                  </div>
                </div> */}
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>{this.state.status}</div>
                  {this.state.error ? <div className='addAccountItemOptionSubmit' onMouseDown={() => this.restart()}>try again</div> : null}
                </div>
              </div>
            </div>
          </div>
          <div
            className='addAccountItemFooter' onMouseDown={() => {
              const net = this.store('main.currentNetwork.id')
              const open = url => this.store.notify('openExternal', { url })
              if (net === '1') return open('https://mainnet.aragon.org')
              if (net === '4') return open('https://rinkeby.aragon.org')
              return open('https://aragon.org')
            }}
          >{''}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddAspis)
