import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Account from './Account'

// import Filter from '../../Components/Filter'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

let firstScroll = true

class Main extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      filter: '',
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

  accountSort(accounts, a, b) {
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

  render() {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const scrollTop = this.store('selected.position.scrollTop')
    const open = current && this.store('selected.open')
    const sortedAccounts = Object.keys(accounts).sort((a, b) => this.accountSort(accounts, a, b))

    const { filter } = this.state

    const { data } = this.store('panel.nav')[0] || {}
    const panelScrollStyle = current ? { overflow: 'hidden', pointerEvents: 'none' } : {}
    if (data && data.aux && data.aux.height) panelScrollStyle.bottom = data.aux.height

    return (
      <div className={this.store('panel.view') !== 'default' ? 'card cardHide' : 'card cardShow'}>
        <div id='panelScroll' style={panelScrollStyle}>
          <div className='panelScrollOverlay' />
          <div
            id='panelSlide'
            ref={(ref) => {
              if (ref) this.scroll = ref
            }}
            style={current ? { overflow: 'visible' } : {}}
          >
            <div
              id='panelWrap'
              style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}
            >
              {/* {untethered.sort().map((id, i) => <PendingSigner key={'signers' + id} {...this.store('main.signers', id)} index={i} />)} */}
              {sortedAccounts.map((id, i) => {
                const account = accounts[id]
                if (
                  filter &&
                  !account.address.includes(filter) &&
                  !account.name.includes(filter) &&
                  !account.ensName.includes(filter) &&
                  !account.lastSignerType.includes(filter)
                )
                  return null
                return (
                  <Account
                    key={id}
                    {...account}
                    index={i}
                    reportScroll={() => this.reportScroll()}
                    resetScroll={() => this.resetScroll()}
                  />
                )
              })}
              {Object.keys(accounts).length === 0 ? (
                <div className='noSigners'>
                  {/* <div className='introLogo'>{svg.logo(70)}</div> */}
                  {`No Accounts Added`}
                  {/* <span className='getStarted'>
                    Add accounts using <div className='getStartedPlus'><span>+</span></div> above
                  </span>
                  <div className='discordInvite' style={{ margin: '0px' }} onMouseDown={() => this.store.notify('openExternal', { url: 'https://discord.gg/UH7NGqY' })}>
                    <div>Need help getting started?</div>
                    <div className='discordLink'>Join our Discord!</div>
                  </div> */}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Main)
