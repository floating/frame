import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import AccountController from './AccountController'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

let firstScroll = true

function filterMatches (text = '', fields) {
  const filter = text.toLowerCase()

  return fields.some(field => (field || '').toLowerCase().includes(filter))
}

class AccountSelector extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      accountFilter: ''
    }
  }

  reportScroll () {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }

  resetScroll () {
    setTimeout(() => {
      if (firstScroll) {
        firstScroll = false
      } else {
        this.scroll.scrollTo({ top: -999999999999, left: 0, behavior: 'smooth' })
      }
    }, 3000)
  }

  accountSort (accounts, a, b) {
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
      console.error(e)
      return 0
    }
  }

  renderAccountFilter () {
    const open = this.store('selected.open')
    if (open) return null
    return (
      <div className='panelFilterMain'>
        <div className='panelFilterIcon'>
          {svg.search(12)}
        </div>
        <div className='panelFilterInput'>
          <input 
            tabIndex='-1'
            onChange={(e) => {
              const value = e.target.value
              this.setState({ accountFilter: value })
              link.send('tray:action', 'setAccountFilter', value)
            }}
            value={this.state.accountFilter}
          />
        </div>
        {this.state.accountFilter ? (
          <div 
            className='panelFilterClear'
            onClick={() => {
              this.setState({ accountFilter: '' })
              link.send('tray:action', 'setAccountFilter', '')
            }}
          >
            {svg.close(12)}
          </div>
        ) : null}
      </div>
    )
  }

  renderAccountList () {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const scrollTop = this.store('selected.position.scrollTop')
    const open = current && this.store('selected.open')

    const sortedAccounts = Object.keys(accounts).sort((a, b) => this.accountSort(accounts, a, b))

    const filter = this.store('panel.accountFilter')

    const { data } = this.store('panel.nav')[0] || {}

    const panelScrollStyle = current ? { pointerEvents: 'none' } : {}

    // if (open) panelScrollStyle.top = '146px'

    const crumb = this.store('windows.panel.nav')[0] || {}
    // if (crumb.view === 'requestView') panelScrollStyle.bottom = '142px'
    
    const displayAccounts = sortedAccounts.filter((id, i) => {
      const account = accounts[id]
      const { address, name, ensName, lastSignerType } = account

      return !filter || filterMatches(filter, ([address, name, ensName, lastSignerType]))
    })

    return (
      <div 
        className='accountSelectorScroll'
        ref={ref => { 
          if (ref) this.scroll = ref 
        }}
      >
        {/* <div className='accountSelectorScrollWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}> */}
        <div className='accountSelectorScrollWrap'>
          {displayAccounts.length ? (
            displayAccounts.map((id, i) => {
              const account = accounts[id]
              return <AccountController key={id} {...account} index={i} reportScroll={() => this.reportScroll()} resetScroll={() => this.resetScroll()} />
            })
          ) : Object.keys(accounts).length === 0 ? (
            <div className='noSigners'>
              {'No Accounts Added'}
            </div>
          ) : (
            <div className='noSigners'>
              {'No Matching Accounts'}
            </div>
          )}
        </div>
      </div>
    )
  }

  render () {
    const open = this.store('selected.open')

    return (
      <div className={open ? 'accountSelector accountSelectorOpen' : 'accountSelector'}>
        {this.renderAccountFilter()}
        {this.renderAccountList()}
      </div>
    )
  }
}

export default Restore.connect(AccountSelector)
