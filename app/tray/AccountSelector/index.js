import React from 'react'
import Restore from 'react-restore'
import GridLayout from 'react-grid-layout'

import AccountController from './AccountController'
import { accountSort as byCreation } from '../../../resources/domain/account'
import { matchFilter } from '../../../resources/utils'
import { Cluster, ClusterBox, ClusterValue, ClusterRow } from '../../../resources/Components/Cluster'
import svg from '../../../resources/svg'
import link from '../../../resources/link'

let firstScroll = true

const AccountsGrid = ({ accounts, reportScroll, resetScroll, accountOpen }) => {
  const layout = accounts.map((account, i) => ({ i: account.id, x: 0, y: i, w: 1, h: 1 }))
  return (
    <GridLayout
      className='layout'
      layout={layout}
      cols={1}
      rowHeight={70}
      width={400}
      draggableHandle='.accountGrabber'
      style={accountOpen ? {} : { marginTop: '40px' }}
      onDragStart={() => {
        link.send('tray:action', 'setReorderingAccounts', true)
      }}
      onDragStop={(layout, _oldItem, newItem) => {
        link.send('tray:action', 'setReorderingAccounts', false)
        const orderedAccounts = layout.map(({ i }) => i)
        orderedAccounts.splice(newItem.y, 0, newItem.i)
        link.send('tray:action', 'setAccountsOrder', orderedAccounts)
      }}
    >
      {accounts.map((account, i) => (
        <AccountController
          key={account.id}
          {...account}
          index={i}
          reportScroll={reportScroll}
          resetScroll={resetScroll}
          accountOpen={accountOpen}
        />
      ))}
    </GridLayout>
  )
}

class AccountSelector extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      accountFilter: context.store('panel.accountFilter') || ''
    }
  }

  reportScroll() {
    const ref = this.scroll.current
    this.store.initialScrollPos(ref?.scrollTop)
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

  renderAccountList(accountOpen) {
    const accounts = this.store('main.accounts')
    const sortedAccountIds = this.store('view.accountsOrder')
    console.log('sorted account Ids', sortedAccountIds)
    const sortedAccounts = sortedAccountIds.length
      ? sortedAccountIds.map((accountId) => accounts[accountId])
      : Object.values(accounts).sort(byCreation)

    console.log('sorted accounts', sortedAccounts)
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
        <div className='accountSelectorScrollWrap'>
          {displayAccounts.length ? (
            <AccountsGrid
              accounts={displayAccounts}
              reportScroll={() => this.reportScroll()}
              resetScroll={() => this.resetScroll()}
              accountOpen={accountOpen}
            />
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
        {this.renderAccountList(open)}
      </div>
    )
  }
}

export default Restore.connect(AccountSelector)
