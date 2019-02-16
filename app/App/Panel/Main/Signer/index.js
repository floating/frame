import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'
import link from '../../../../link'

import Requests from './Requests'
import Settings from './Settings'

import ledgerLogo from './ledgerLogo.png'
import trezorLogo from './trezorLogo.png'

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.locked = false
    this.state = { typeHover: false, accountPage: 0, accountHighlight: 'default', highlightIndex: 0, tPin: '' }
  }
  copyAddress (e) {
    e.preventDefault()
    e.target.select()
    document.execCommand('Copy')
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }
  trezorPin (num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }
  submitPin () {
    link.rpc('trezorPin', this.props.id, this.state.tPin, () => {})
    this.setState({ tPin: '' })
  }
  backspacePin (e) {
    e.stopPropagation()
    this.setState({ tPin: this.state.tPin ? this.state.tPin.slice(0, -1) : '' })
  }
  select () {
    if (this.store('signer.current') === this.props.id) {
      link.rpc('unsetSigner', (err, status) => { if (err) return console.log(err) })
    } else {
      let bounds = this.signer.getBoundingClientRect()
      this.props.reportScroll()
      this.store.initialSignerPos({ top: bounds.top, bottom: document.body.clientHeight - bounds.top - this.signer.clientHeight + 3, height: this.signer.clientHeight, index: this.props.index })
      link.rpc('setSigner', this.props.id, (err, status) => { if (err) return console.log(err) })
    }
  }
  renderTrezorPin (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        <div className='trezorPinInput'>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
              {svg.octicon('primitive-dot', { height: 20 })}
            </div>
          ))}
        </div>
      </div>
    )
  }
  renderArrows () {
    return (
      <React.Fragment>
        <div className='signerSelect signerSelectLeft'>
          <div className='signerSelectArrows'>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', { height: 18 })}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', { height: 18 })}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', { height: 18 })}</div>
          </div>
        </div>
        <div className='signerSelect signerSelectRight'>
          <div className='signerSelectArrows'>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', { height: 18 })}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', { height: 18 })}</div>
            <div className='signerSelectArrow'>{svg.octicon('chevron-up', { height: 18 })}</div>
          </div>
        </div>
      </React.Fragment>
    )
  }
  typeClick () {
    if (this.props.status === 'ok') {
      this.select()
      this.setState({ typeActive: true })
      setTimeout(() => this.setState({ typeActive: false }), 110)
    } else {
      this.setState({ typeShake: true })
      setTimeout(() => this.setState({ typeShake: false }), 1010)
    }
  }
  renderType () {
    let innerClass = 'signerInner'
    if (this.state.typeActive) innerClass += ' signerInnerActive'
    if (this.state.typeShake) innerClass += ' headShake'
    if (this.store('signer.view') === 'settings') innerClass += ' signerTypeSettings'
    return (
      <div className='signerType'>
        {this.renderArrows('up')}
        <div className={innerClass} onMouseDown={::this.typeClick}>
          <div className='signerInset'>
            <div className='signerImage'>
              {(_ => {
                if (this.props.type === 'Ledger') return <img src={ledgerLogo} />
                if (this.props.type === 'Trezor') return <img className='trezorImage' src={trezorLogo} />
                return svg.octicon('zap', { height: 31 })
              })()}
            </div>
            <div className='signerText'>{this.props.type}</div>
          </div>
        </div>
        <div className='addressSelect' onMouseDown={e => {
          e.stopPropagation()
          this.store.toggleShowAccounts()
        }}>
          <div className='addressSelectButton'>
            <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
            <div className='addressSelectText'>{'Accounts'}</div>
            <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
          </div>
        </div>
      </div>
    )
  }
  renderMenu () {
    let menuClass = 'signerMenu'
    menuClass += this.store('signer.view') === 'settings' ? ' signerMenuSettings' : ' signerMenuDefault'
    if (this.store('signer.current') === this.props.id & this.store('signer.open')) menuClass += ' signerMenuOpen'
    return (
      <div className={menuClass}>
        <div className='signerMenuItem signerMenuItemLeft' onMouseDown={() => this.store.setSignerView('default')} >
          <div className='signerMenuItemIcon'>
            {svg.octicon('pulse', { height: 23 })}
            <div className='iconUnderline' />
          </div>
        </div>
        <div className='signerMenuItem signerMenuItemRight' onMouseDown={() => this.store.setSignerView('settings')}>
          <div className='signerMenuItemIcon'>
            {svg.octicon('settings', { height: 23 })}
            <div className='iconUnderline' />
          </div>
        </div>
      </div>
    )
  }
  setHighlight (mode, index) {
    if (!this.locked) this.setState({ accountHighlight: mode, highlightIndex: index || 0 })
  }
  closeAccounts () {
    if (this.store('signer.showAccounts')) this.store.toggleShowAccounts(false)
  }
  setSignerIndex (index) {
    this.locked = true
    link.rpc('setSignerIndex', index, (err, summary) => {
      this.setState({ accountHighlight: 'inactive', highlightIndex: 0 })
      this.store.toggleShowAccounts(false)
      setTimeout(() => { this.locked = false }, 1000)
      if (err) return console.log(err)
    })
  }
  renderSettingsMenu () {
    let viewIndex = this.store('signer.settings.viewIndex')
    let views = this.store('signer.settings.views')
    let itemWidth = 35
    let markLeft = (itemWidth * viewIndex) + 'px'
    let markRight = (((views.length - viewIndex) - 1) * itemWidth) + 'px'
    return (
      <div className='settingsMenu'>
        <div className='settingsMenuItems'>
          <div className={viewIndex === 0 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(0)}>
            <div className='settingsMenuItemIcon' style={{ left: '2px', top: '2px' }}>{svg.octicon('key', { height: 18 })}</div>
          </div>
          <div className={viewIndex === 1 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(1)}>
            <div className='settingsMenuItemIcon'>{svg.octicon('checklist', { height: 22 })}</div>
          </div>
        </div>
        <div className='settingsMenuSelect'>
          <div className='settingsMenuMark' style={{ left: markLeft, right: markRight }}>
            <div className='settingsMenuMarkLine' />
          </div>
        </div>
      </div>
    )
  }
  renderAccountList () {
    let index = this.store('signers', this.props.id, 'index')
    let startIndex = this.state.accountPage * 5
    let highlight = (this.state.accountHighlight === 'inactive') ? index : this.state.highlightIndex
    return (
      <div className='accountListWrap'>
        <div className='accountList' onMouseDown={e => e.stopPropagation()}>
          <div className='accountListItems'>
            {this.store('signers', this.props.id, 'accounts').slice(startIndex, startIndex + 5).map((a, i) => {
              i = startIndex + i
              let balance = this.store('balances', a)
              return (
                <div key={i} className={i === highlight ? 'accountListItem accountListItemSelected' : 'accountListItem'} onMouseDown={() => this.setSignerIndex(i)} onMouseEnter={() => this.setHighlight('active', i)} onMouseLeave={() => this.setHighlight('inactive', i)}>
                  <div className='accountListItemCheck'>{svg.octicon('check', { height: 27 })}</div>
                  <div className='accountListItemAddress'>{a.substring(0, 6)}{svg.octicon('kebab-horizontal', { height: 16 })}{a.substr(a.length - 4)}</div>
                  <div className='accountListItemBalance'>{'Ξ ' + (balance === undefined ? '-.----' : parseFloat(balance).toFixed(4))}</div>
                </div>
              )
            })}
          </div>
          <div className='accountPageToggle'>
            <div className='accountPageButton accountPageButtonLeft' onMouseDown={() => this.updateAccountPage('<')}>{svg.octicon('chevron-left', { height: 18 })}</div>
            <div className='accountPageCurrent'>{this.state.accountPage + 1}</div>
            <div className='accountPageButton accountPageButtonRight' onMouseDown={() => this.updateAccountPage('>')}>{svg.octicon('chevron-right', { height: 18 })}</div>
          </div>
          {this.renderSettingsMenu()}
        </div>
      </div>
    )
  }
  updateAccountPage (d) {
    let accountPage = d === '<' ? this.state.accountPage - 1 : this.state.accountPage + 1
    let max = Math.ceil((this.store('signers', this.props.id, 'accounts').length / 5) - 1)
    if (accountPage < 0) accountPage = 0
    if (accountPage > max) accountPage = max
    this.setState({ accountPage })
  }
  renderStatus () {
    // TODO: Set Signer Name
    let currentIndex = this.store('signers', this.props.id, 'index')
    let status = this.props.status.charAt(0).toUpperCase() + this.props.status.substr(1)
    if (this.state.accountHighlight === 'active') currentIndex = this.state.highlightIndex
    let accounts = this.store('signers', this.props.id, 'accounts')
    return (
      <div className='signerStatus' key={this.props.status}>
        {this.props.status !== 'ok' ? (
          this.props.status === 'Need Pin' ? (
            <div className='signerStatusNotOk'>
              <div className='signerPinDisplay' style={!this.state.tPin ? { opacity: 0, height: '0px', paddingBottom: '0px' } : { opacity: 1, height: '13px', paddingBottom: '17px' }}>
                {this.state.tPin.split('').map((n, i) => {
                  return (
                    <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
                      {svg.octicon('primitive-dot', { height: 14 })}
                    </div>
                  )
                })}
              </div>
              <div className={this.state.tPin ? 'signerPinMessage signerPinSubmit' : 'signerPinMessage'} onMouseDown={this.state.tPin ? () => this.submitPin() : null}>
                {this.state.tPin ? 'Submit' : 'Enter Pin'}
                <div className='signerPinDelete' onMouseDown={this.backspacePin.bind(this)}>
                  {svg.octicon('arrow-left', { height: 24 })}
                </div>
              </div>
            </div>
          ) : (
            <div className='signerStatusNotOk'>
              {status}
            </div>
          )
        ) : (
          <div className='signerAccounts' style={{ width: '1500%', left: '-' + (currentIndex * 100) + '%' }}>
            {accounts.map((account, index) => {
              let balance = this.store('balances', account)
              return (
                <div key={account + index} className='signerAccount' style={{ minWidth: `calc(100% / 15)` }}>
                  <div className='signerName'>
                    <div className='signerNameText'>
                      {this.props.type + ' Account'}
                      <div className='signerNameEdit'>{svg.octicon('pencil', { height: 18 })}</div>
                    </div>
                  </div>
                  <div className='signerAddress'>
                    <div className='transactionToAddress'>
                      <div className='transactionToAddressLarge'>{account.substring(0, 10)} {svg.octicon('kebab-horizontal', { height: 20 })} {account.substr(account.length - 10)}</div>
                      <div className='transactionToAddressFull'>
                        {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : account}
                        <input tabIndex='-1' onMouseDown={e => this.copyAddress(e)} value={account} readOnly />
                      </div>
                    </div>
                  </div>
                  <div className='signerInfo'>
                    <div className='signerBalance'>
                      <span className='signerBalanceCurrency'>{'Ξ'}</span>
                      {(balance === undefined ? '-.------' : parseFloat(balance).toFixed(6))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
  render () {
    let current = (this.store('signer.current') === this.props.id) && this.props.status === 'ok'
    let open = current && this.store('signer.open')
    let minimized = this.store('signer.minimized')
    this.selected = current && !minimized
    let signerClass = 'signer'
    if (this.props.status === 'ok') signerClass += ' okSigner'
    if (open) signerClass += ' openSigner'
    if (this.store('signer.view') === 'settings') signerClass += ' signerInSettings'
    if (this.store('signer.showAccounts')) signerClass += ' signerAccountExpand'

    let style = {}
    let initial = this.store('signer.position.initial')

    if (current) {
      // Currently selected
      style.position = 'absolute'
      style.top = initial.top // open ? 40 : initial.top
      style.bottom = initial.bottom // open ? 3 : initial.bottom
      style.left = 0
      style.right = 0
      style.zIndex = '1000000000000'
      let panelHeight = document.getElementById('panel').offsetHeight
      style.height = open ? panelHeight - 50 : initial.height - 3
      style.transform = open ? `translateY(-${initial.top - 44}px)` : `translateY(0px)`
    } else if (this.store('signer.current') !== '') {
      // Not currently selected, but another signer is
      style.opacity = 0
      style.pointerEvents = 'none'
      style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'
      if (this.store('signer.open')) {
        // Not open, but another signer is
        style.transform = this.props.index > this.store('signer.position.initial.index') ? 'translate(0px, 100px)' : 'translate(0px, -100px)'
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        style.transform = 'translate(0px, 0px)'
        style.opacity = 1
      }
    }
    return (
      <div className='signerWrap' style={current ? { height: initial.height + 'px' } : {}} onMouseDown={() => this.closeAccounts()}>
        <div className={signerClass} style={style} ref={ref => { if (ref) this.signer = ref }}>
          <div className='signerContainer' style={current ? { height: '100%' } : {}}>
            <div className='signerTop'>
              <div className='signerNav'> {this.renderMenu()} {this.renderType()} </div>
              {this.renderStatus()}
              {this.renderTrezorPin(this.props.type === 'Trezor' && this.props.status === 'Need Pin')}
            </div>
            {this.renderAccountList()}
            <div className='signerMid' style={open ? { top: this.store('signer.view') === 'settings' ? '200px' : '200px' } : { pointerEvents: 'none' }}>
              <Settings id={this.props.id} />
              <Requests id={this.props.id} accounts={this.props.accounts} minimized={minimized} />
            </div>
            <div className='signerBot' />
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Signer)
