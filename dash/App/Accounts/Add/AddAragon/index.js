import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'
import { accountSort as byCreation } from '../../../../../resources/domain/account'

class AddAragon extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      adding: false,
      agent: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      index: 0,
      status: '',
      error: false,
      name: ''
    }
    this.forms = [React.createRef(), React.createRef()]
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

  actorAccount  (actorAddress) {
    link.rpc('resolveAragonName', this.state.name, this.state.chainId, (err, dao) => {
      this.next()
      if (err) return this.setState({ status: err, error: true })
      const aragonAccount = {
        address: dao.apps.agent.proxyAddress, // Agent Address
        type: 'aragon',
        name: dao.name + ' DAO',
        smart: {
          type: 'aragon',
          chain: { id: this.state.chainId, type: 'ethereum' },
          actor: actorAddress, // Reference to Frame account that will act on behalf of the agent
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
            this.props.close()
          }, 2000)
        }
      })
    })
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
    const accounts = this.store('main.accounts')
    return (
      <div className={itemClass}>
        <div className='addAccountItemBar addAccountItemSmart' />
        <div className='addAccountItemWrap'>
          <div className='addAccountItemTop'>
            <div className='addAccountItemTopType'>
              <div className='addAccountItemIcon'>
                <RingIcon svgName={'aragon'} svgSize={24} />
              </div>
              <div className='addAccountItemTopTitle'>Aragon DAO</div>
            </div>
            {/* <div className='addAccountItemClose' onMouseDown={() => this.props.close()}>{'Done'}</div> */}
            <div className='addAccountItemSummary'>An Aragon smart account allows you to use your Aragon DAO with any dapp</div>
          </div>
          <div className='addAccountItemOption'>
            <div className='addAccountItemOptionIntro' onMouseDown={() => this.adding()}>
              <div className='addAccountItemDeviceTitle'>Add Aragon Account</div>
            </div>
            <div className='addAccountItemOptionSetup' style={{ transform: `translateX(-${100 * this.state.index}%)` }}>
              <div className='addAccountItemOptionSetupFrames'>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>enter chain id</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input tabIndex='-1' ref={this.forms[0]} value={this.state.chainId} onChange={e => this.onChange('chainId', e)} onFocus={e => this.onFocus('chainId', e)} onBlur={e => this.onBlur('chainId', e)} onKeyPress={e => { if (e.key === 'Enter') this.next() }} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>Next</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>enter dao name</div>
                  <div className='addAccountItemOptionInputPhrase'>
                    <input tabIndex='-1' ref={this.forms[1]} value={this.state.name} onChange={e => this.onChange('name', e)} onFocus={e => this.onFocus('name', e)} onBlur={e => this.onBlur('name', e)} onKeyPress={e => { if (e.key === 'Enter') this.next() }} />
                  </div>
                  <div className='addAccountItemOptionSubmit' onMouseDown={() => this.next()}>Next</div>
                </div>
                <div className='addAccountItemOptionSetupFrame'>
                  <div className='addAccountItemOptionTitle'>Choose acting account</div>
                  <div className='addAccountItemOptionList'>
                    {Object.values(accounts)
                      .filter(account => account.type !== 'aragon' )
                      .sort(byCreation)
                      .map(({id, name}) => {
                        return <div key={id} className='addAccountItemOptionListItem' onMouseDown={e => this.actorAccount(id)}>
                          <div className='actingAccountAddress'>{id ? id.substring(0, 8) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{id ? id.substr(id.length - 6) : ''}</div>
                          <div className='actingAccountTag'>{name}</div>
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
            className='addAccountItemFooter' onClick={() => {
              const net = this.store('main.currentNetwork.id')
              const open = url => link.send('tray:openExternal', url)
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

export default Restore.connect(AddAragon)
