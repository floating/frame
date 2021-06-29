import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Account from './Account'

import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

let firstScroll = true

class Main extends React.Component {
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
      log.error(e)
      return 0
    }
  }

  render () {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const scrollTop = this.store('selected.position.scrollTop')
    const open = current && this.store('selected.open')
    const sortedAccounts = Object.keys(accounts).sort((a, b) => this.accountSort(accounts, a, b))
    return (
      <div className={this.store('panel.view') !== 'default' ? 'card cardHide' : 'card cardShow'}>
        <div id='panelScroll' style={current ? { overflow: 'hidden', pointerEvents: 'none' } : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? { overflow: 'visible' } : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              <div className='panelHeader' style={open ? { zIndex: 50, pointerEvents: 'none', opacity: 0 } : { opacity: 1, transform: 'translateY(0px)' }}>
                <div className='panelHeaderTitle'>Accounts</div>
                <div className={!this.store('dash.showing') ? 'panelHeaderUpdate' : 'panelHeaderUpdate panelHeaderUpdateNotify'} onMouseDown={() => {
                  link.send('tray:action', 'toggleDash')
                }}>
                  <div className='panelHeaderUpdateInner'>
                    <div className={!this.store('dash.showing') ? 'panelHeaderUpdateToggle' : 'panelHeaderUpdateToggle panelHeaderUpdateToggleOn'}>
                      {'+'}
                    </div>
                    <div className='panelHeaderUpdateOn' />
                  </div>
                </div>
              </div>
              {/* {untethered.sort().map((id, i) => <PendingSigner key={'signers' + id} {...this.store('main.signers', id)} index={i} />)} */}
              {sortedAccounts.map((id, i) => {
                return <Account key={id} {...accounts[id]} index={i} reportScroll={() => this.reportScroll()} resetScroll={() => this.resetScroll()} />
              })}
              {Object.keys(accounts).length === 0 ? (
                <div className='noSigners'>
                  <div className='introLogo'>{svg.logo(70)}</div>
                  {`No Accounts Found`}
                  <span className='getStarted'>
                    Add accounts using <div className='getStartedPlus'><span>+</span></div> above
                  </span>
                  <div className='discordInvite' style={{ margin: '0px' }} onMouseDown={() => this.store.notify('openExternal', { url: 'https://discord.gg/UH7NGqY' })}>
                    <div>Need help getting started?</div>
                    <div className='discordLink'>Join our Discord!</div>
                  </div>
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
