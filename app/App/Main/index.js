import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Account from './Account'

// import Filter from '../../Components/Filter'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

let firstScroll = true

class Main extends React.Component {
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

  render () {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const scrollTop = this.store('selected.position.scrollTop')
    const open = current && this.store('selected.open')
    const sortedAccounts = Object.keys(accounts).sort((a, b) => this.accountSort(accounts, a, b))
    const filter = this.store('panel.accountFilter')

    const { data } = this.store('panel.nav')[0] || {}
    const panelScrollStyle = current ? { overflow: 'hidden', pointerEvents: 'none' } : {}
    if (data && data.aux && data.aux.height) panelScrollStyle.bottom = data.aux.height

    const displayAccounts = sortedAccounts.filter((id, i) => {
      const account = accounts[id]
      return !(
        filter &&
        !account.address.includes(filter) &&
        !account.name.includes(filter) &&
        !account.ensName.includes(filter) &&
        !account.lastSignerType.includes(filter)
      )
    })

    return (
      <div className={this.store('panel.view') !== 'default' ? 'card cardHide' : 'card cardShow'}>
        <div id='panelScroll' style={panelScrollStyle}>
          <div className='panelScrollOverlay' />
          <div 
            id='panelSlide' 
            ref={ref => { if (ref) this.scroll = ref }} 
            style={current ? { overflow: 'visible' } : {}}
          >
            <div className='panelFilter'>
              <div className='panelFilterIcon'>
                {svg.search(12)}
              </div>
              <div className='panelFilterInput'>
                <input 
                  onChange={(e) => {
                    const value = e.target.value
                    this.setState({ accountFilter: value  })
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
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              {displayAccounts.length ? (
                displayAccounts.map((id, i) => {
                  const account = accounts[id]
                  return <Account key={id} {...account} index={i} reportScroll={() => this.reportScroll()} resetScroll={() => this.resetScroll()} />
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
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
