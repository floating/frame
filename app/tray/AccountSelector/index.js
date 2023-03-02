import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import AccountController from './AccountController'

import { accountSort as byCreation } from '../../../resources/domain/account'
import { matchFilter } from '../../../resources/utils'

import { Cluster, ClusterBox, ClusterValue, ClusterRow } from '../../../resources/Components/Cluster'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

let firstScroll = true

// function filterMatches (text = '', fields) {
//   const filter = text.toLowerCase()

//   return fields.some(field => (field || '').toLowerCase().includes(filter))
// }

class AccountSelector extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      accountFilter: context.store('panel.accountFilter') || ''
    }
  }

  reportScroll() {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }

  resetScroll() {
    setTimeout(() => {
      if (firstScroll) {
        firstScroll = false
      } else {
        this.scroll.scrollTo({ top: -999999999999, left: 0, behavior: 'smooth' })
      }
    }, 3000)
  }

  renderAccountFilter() {
    const accounts = this.store('main.accounts')
    const open = this.store('selected.open')
    if (Object.keys(accounts).length === 0 || open) return null

    return (
      <div className='panelFilterMain'>
        <div className='panelFilterIcon'>{svg.search(12)}</div>
        <div className='panelFilterInput'>
          <input
            tabIndex='-1'
            spellCheck='false'
            onChange={(e) => {
              const value = e.target.value
              this.setState({ accountFilter: value })
              link.send('tray:action', 'setAccountFilter', value)
            }}
            value={this.state.accountFilter}
          />
        </div>
        {this.store('panel.accountFilter') ? (
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

  renderAccountList() {
    const accounts = this.store('main.accounts')
    const sortedAccounts = Object.values(accounts).sort(byCreation)
    const filter = this.store('panel.accountFilter')

    const displayAccounts = sortedAccounts.filter(({ address, name, ensName, lastSignerType }) => {
      return matchFilter(filter, [address, name, ensName, lastSignerType])
    })

    return (
      <div
        className='accountSelectorScroll'
        ref={(ref) => {
          if (ref) this.scroll = ref
        }}
      >
        {/* <div className='accountSelectorScrollWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}> */}
        <div className='accountSelectorScrollWrap'>
          {displayAccounts.length ? (
            displayAccounts.map((account, i) => (
              <AccountController
                key={account.id}
                {...account}
                index={i}
                reportScroll={() => this.reportScroll()}
                resetScroll={() => this.resetScroll()}
              />
            ))
          ) : Object.keys(accounts).length === 0 ? (
            <ClusterBox style={{ pointerEvents: 'auto' }}>
              <Cluster>
                <ClusterRow>
                  <ClusterValue>
                    <div className='noSigners'>{'No Accounts Added'}</div>
                  </ClusterValue>
                </ClusterRow>
                <ClusterRow>
                  <ClusterValue
                    testId='new-account-btn'
                    onClick={() => {
                      link.send('tray:action', 'navDash', {
                        view: 'accounts',
                        data: { showAddAccounts: true }
                      })
                    }}
                  >
                    <div className='newAccountButton'>
                      <div className='newAccountIcon'>{svg.accounts(16)}</div>
                      <div className='newAccountText'>{'Add New Account'}</div>
                    </div>
                  </ClusterValue>
                </ClusterRow>
              </Cluster>
            </ClusterBox>
          ) : (
            <div className='noSigners'>{'No Matching Accounts'}</div>
          )}
        </div>
      </div>
    )
  }

  render() {
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
