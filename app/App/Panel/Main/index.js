import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Signer from './Signer'
import PendingSigner from './PendingSigner'
import Add from './Add'

import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

let firstScroll = true

class Main extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      dashboard: false
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
    a = accounts[a].created
    b = accounts[b].created
    if (a === -1 && b !== -1) return -1
    if (a !== -1 && b === -1) return 1
    if (a > b) return -1
    if (a < b) return 1
    return 0
  }

  render () {
    const accounts = this.store('main.accounts')
    const network = this.store('main.currentNetwork.id')
    const type = this.store('main.currentNetwork.type')
    // Object.keys(this.store('main.accounts')).forEach(id => {
    //   const account = this.store('main.accounts', id)
    //   if (account.network === network) accounts[id] = account
    // })
    // const signers = {}
    // Object.keys(this.store('main.signers')).forEach(id => {
    //   const signer = this.store('main.signers', id)
    //   if (signer.network === network) signers[id] = signer
    // })

    const untethered = [] // Object.keys(signers).filter(id => Object.keys(accounts).indexOf(id) < 0)
    const current = this.store('selected.current')
    const scrollTop = this.store('selected.position.scrollTop')
    const open = current && this.store('selected.open')
    return (
      <div className={this.store('panel.view') !== 'default' ? 'card cardHide' : 'card cardShow'}>
        <div id='panelScroll' style={current ? { overflow: 'hidden', pointerEvents: 'none' } : {}}>
          <div id='panelSlide' ref={ref => { if (ref) this.scroll = ref }} style={current ? { overflow: 'visible' } : {}}>
            <div id='panelWrap' style={current && scrollTop > 0 ? { marginTop: '-' + scrollTop + 'px' } : {}}>
              <div className='panelHeader' style={open ? { zIndex: 50, pointerEvents: 'none', opacity: 0 } : { opacity: 1, transform: 'translateY(0px)' }}>
                <div className='panelHeaderTitle'>Accounts</div>
                <div className='panelHeaderUpdate' onMouseDown={() => {
                  this.setState({ dashboard: !this.state.dashboard })
                  link.send('tray:toggleDash', 'signers')
                }}>
                  <div className='panelHeaderUpdateToggle' style={this.state.dashboard ? { transform: 'translateX(12px)' } : { transform: 'translateX(0px)' }} />
                  <div className='panelHeaderUpdateOn' />
                </div>
              </div>
              {untethered.sort().map((id, i) => <PendingSigner key={'signers' + id} {...this.store('main.signers', id)} index={i} />)}
              {Object.keys(accounts).sort((a, b) => this.accountSort(accounts, a, b)).map((id, i) => {
                return <Signer key={id} {...accounts[id]} index={i} reportScroll={() => this.reportScroll()} resetScroll={() => this.resetScroll()} />
              })}
              {Object.keys(accounts).length === 0 ? (
                <div className='noSigners'>
                  <div className='introLogo'>{svg.logo(70)}</div>
                  {`No ${this.store('main.networks', type, network, 'name')} Accounts Found`}
                  <span className='getStarted'>
                    Use the
                    <div className='getStartedPlus'><span>+</span></div>
                    below or connect a hardware signer to automatically populate your accounts
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
