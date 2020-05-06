import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'
import link from '../../../../link'

import Requests from './Requests'
import Verify from './Verify'
import Control from './Control'
import Permissions from './Permissions'
import Status from './Status'

class Account extends React.Component {
  constructor (...args) {
    super(...args)
    this.locked = false
    this.state = {
      typeHover: false,
      accountHighlight: 'default',
      highlightIndex: 0,
      unlockInput: '',
      openHover: false
    }
    this.views = [Requests, Permissions, Verify, Control]
  }

  componentDidMount () {
    if (this.props.index === 0) this.props.resetScroll()
  }

  copyAddress (e) {
    e.preventDefault()
    e.target.select()
    document.execCommand('Copy')
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  unlockChange (e) {
    this.setState({ unlockInput: e.target.value })
  }

  unlockSubmit (e) {
    link.rpc('unlockSigner', this.props.id, this.state.unlockInput, () => {})
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
    if (this.store('selected.current') === this.props.id) {
      link.rpc('unsetSigner', this.props.id, (err, status) => { if (err) return console.log(err) })
      if (this.props.signer) link.rpc('lockSigner', this.props.signer.id, (err, status) => { if (err) return console.log(err) })
    } else {
      const bounds = this.signer.getBoundingClientRect()
      this.props.reportScroll()
      console.log('this.store(selected.position.scrollTop)', this.store('selected.position.scrollTop'))
      console.log('this.store(selected.position.shiftTop)', this.store('selected.position.shiftTop'))
      console.log('bounds.top', bounds.top)
      this.store.initialSignerPos({
        top: bounds.top - 50,
        bottom: document.body.clientHeight - bounds.top - this.signer.clientHeight + 3,
        height: this.signer.clientHeight,
        index: this.props.index
      })
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
      <>
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
      </>
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

  // renderType () {
  //   let innerClass = 'signerInner'
  //   if (this.state.typeActive) innerClass += ' signerInnerActive'
  //   if (this.state.typeShake) innerClass += ' headShake'
  //   if (this.store('selected.view') === 'settings') innerClass += ' signerTypeSettings'
  //   if (!this.props.signer || (this.props.signer && this.props.signer.status === 'initial')) innerClass += ' signerInnerDisconnected'
  //   const inSettings = this.store('selected.view') === 'settings'
  //   return (
  //     <div className='signerType'>
  //       <div
  //         className='addressSelect'
  //         onMouseDown={e => {
  //           e.stopPropagation()
  //           this.store.toggleShowAccounts()
  //         }}
  //       >
  //         <div className='addressSelectButton'>
  //           <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
  //           <div className='addressSelectText'>Addresses</div>
  //           <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
  //         </div>
  //       </div>
  //       {!this.props.signer || (this.props.signer && this.props.signer.status === 'initial') ? (
  //         <div className='signerTypeDisconnected' onMouseDown={::this.typeClick} style={inSettings ? { transform: 'translateY(-30px)' } : {}} onMouseEnter={() => this.setState({ openHover: true })} onMouseLeave={() => this.setState({ openHover: false })}>
  //           <div className='signerTypeDisconnectedImageFront'>{svg.logo(24)}</div>
  //         </div>
  //       ) : null}
  //       <div className={innerClass} onMouseDown={::this.typeClick} onMouseEnter={() => this.setState({ openHover: true })} onMouseLeave={() => this.setState({ openHover: false })}>
  //         <div className='signerInset'>
  //           <div className='signerImage'>
  //             {(_ => {
  //               if (this.props.signer) {
  //                 if (this.props.signer.type === 'ledger') return <img src={ledgerLogo} />
  //                 if (this.props.signer.type === 'trezor') return <img className='trezorImage' src={trezorLogo} />
  //                 if (this.props.signer.type === 'seed' || this.props.signer.type === 'ring') return svg.flame(21)
  //                 if (this.props.signer.type === 'aragon') return svg.aragon(32)
  //                 return svg.octicon('plus', { height: 31 })
  //               } else {
  //                 return null
  //               }
  //             })()}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  // renderMenu () {
  //   let menuClass = 'signerMenu'
  //   menuClass += this.store('selected.view') === 'settings' ? ' signerMenuSettings' : ' signerMenuDefault'
  //   if (this.store('selected.current') === this.props.id & this.store('selected.open')) menuClass += ' signerMenuOpen'
  //   return (
  //     <div className={menuClass}>
  //       <div className='signerMenuItem signerMenuItemLeft' onMouseDown={() => this.store.setSignerView('default')}>
  //         <div className='signerMenuItemIcon'>
  //           {svg.octicon('pulse', { height: 23 })}
  //           <div className='iconUnderline' />
  //         </div>
  //       </div>
  //       <div className='signerMenuItem signerMenuItemRight' onMouseDown={() => this.store.setSignerView('settings')}>
  //         <div className='signerMenuItemIcon'>
  //           {svg.octicon('settings', { height: 23 })}
  //           <div className='iconUnderline' />
  //         </div>
  //       </div>
  //     </div>
  //   )
  // }

  setHighlight (mode, index) {
    if (!this.locked) this.setState({ accountHighlight: mode, highlightIndex: index || 0 })
  }

  closeAccounts () {
    if (this.store('selected.showAccounts')) this.store.toggleShowAccounts(false)
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
    let viewIndex = this.store('selected.settings.viewIndex')

    // FIXME: Ugly hack to allow 'Rename Account' view to slide in from right
    if (viewIndex === 3) viewIndex = 2

    const views = this.store('selected.settings.views')
    const itemWidth = 35
    const markLeft = (itemWidth * viewIndex) + 'px'
    const markRight = (((views.length - viewIndex) - 1) * itemWidth) + 'px'
    return (
      <div className='settingsMenu'>
        <div className='settingsMenuItems'>
          <div className={viewIndex === 0 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(0)}>
            <div className='settingsMenuItemIcon' style={{ left: '2px', top: '2px' }}>{svg.octicon('key', { height: 18 })}</div>
          </div>
          <div className={viewIndex === 1 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(1)}>
            <div className='settingsMenuItemIcon'>{svg.octicon('checklist', { height: 22 })}</div>
          </div>
          <div className={viewIndex === 2 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(2)}>
            <div className='settingsMenuItemIcon' style={{ left: '-1px', top: '0px' }}>{svg.octicon('gear', { height: 20 })}</div>
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
    const index = this.store('main.accounts', this.props.id, 'index')
    const startIndex = this.store('selected.accountPage') * 5
    const highlight = (this.state.accountHighlight === 'inactive') ? index : this.state.highlightIndex
    return (
      <div className='accountListWrap'>
        <div className='accountList' onMouseDown={e => e.stopPropagation()}>
          <div className='accountListItems'>
            {this.store('main.accounts', this.props.id, 'addresses').slice(startIndex, startIndex + 5).map((a, i) => {
              i = startIndex + i
              const ens = this.store('main.accounts', this.props.id, 'ens', i)
              const balance = this.store('balances', a)
              return (
                <div key={i} className={i === highlight ? 'accountListItem accountListItemSelected' : 'accountListItem'} onMouseDown={() => this.setSignerIndex(i)} onMouseEnter={() => this.setHighlight('active', i)} onMouseLeave={() => this.setHighlight('inactive', i)}>
                  <div className='accountListItemCheck'>{svg.octicon('check', { height: 27 })}</div>
                  {
                    ens ? (
                      <div className='accountListItemAddress'>{ens}</div>
                    ) : (
                      <div className='accountListItemAddress'>{a ? a.substring(0, 6) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{a ? a.substr(a.length - 4) : ''}</div>
                    )
                  }
                  <div className='accountListItemBalance'>{'Ξ ' + (balance === undefined ? '-.------' : parseFloat(balance).toFixed(6))}</div>
                </div>
              )
            })}
          </div>
          <div className='accountPageToggle'>
            <div className='accountPageButton accountPageButtonLeft' onMouseDown={() => this.updateAccountPage('<')}>{svg.octicon('chevron-left', { height: 18 })}</div>
            <div className='accountPageCurrent'>{this.store('selected.accountPage') + 1}</div>
            <div className='accountPageButton accountPageButtonRight' onMouseDown={() => this.updateAccountPage('>')}>{svg.octicon('chevron-right', { height: 18 })}</div>
          </div>
          {this.renderSettingsMenu()}
        </div>
      </div>
    )
  }

  updateAccountPage (d) {
    let accountPage = this.store('selected.accountPage')
    accountPage = d === '<' ? accountPage - 1 : accountPage + 1
    const max = Math.ceil((this.store('main.accounts', this.props.id, 'addresses').length / 5) - 1)
    if (accountPage < 0) accountPage = 0
    if (accountPage > max) accountPage = max
    this.store.accountPage(accountPage)
  }

  renderView (index) {
    const visible = this.store('selected.visible')
    const show = visible.indexOf(index) > -1
    const View = this.views[index]
    return (
      <div className='accountView'>
        {show ? <View {...this.props} /> : null}
      </div>
    )
  }

  renderViews (open) {
    const count = 4
    const index = this.store('selected.view')
    return (
      <div className={open ? 'accountViews accountViewsShow' : 'accountViews accountViewsHide'}>
        <div className='accountViewsSlide' style={{ transform: `translateX(-${index * (100 / count)}%)`, width: (count * 100) + '%' }}>
          {open && this.renderView(0)}
          {open && this.renderView(1)}
          {open && this.renderView(2)}
          {open && this.renderView(3)}
        </div>
      </div>
    )
  }

  renderStatus () {
    // let open = current && this.store('selected.open')
    // TODO: Set Signer Name
    let currentIndex = this.store('main.accounts', this.props.id, 'index')
    const status = this.props.status.charAt(0).toUpperCase() + this.props.status.substr(1)
    if (this.state.accountHighlight === 'active') currentIndex = this.state.highlightIndex
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    const ens = this.store('main.accounts', this.props.id, 'ens', currentIndex)
    const balance = this.store('balances', address)
    if (!address) return null
    return (
      <div className='signerStatus' key={this.props.status}>
        {this.props.status !== 'ok' ? (
          <div className='signerStatusNotOk'>{status}</div>
        ) : (
          <div className='signerAccounts' style={{ width: '100%' }}>
            <div key={address + currentIndex} className='signerAccount' style={{ minWidth: 'calc(100%)' }}>
              <div className='signerName'>
                <div className='signerNameText'>
                  {this.props.name}
                  <div className='signerNameEdit'>{svg.octicon('pencil', { height: 18 })}</div>
                </div>
              </div>
              <div className='signerAddress'>
                <div className='transactionToAddress'>
                  {ens ? (
                    <div className='transactionToAddressLarge'>
                      {ens}
                    </div>
                  ) : (
                    <div className='transactionToAddressLarge'>
                      {address.substring(0, 6)}
                      {svg.octicon('kebab-horizontal', { height: 17 })}
                      {address.substr(address.length - 4)}
                    </div>
                  )}
                  <div className='transactionToAddressFull'>
                    {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : address}
                    <input tabIndex='-1' onMouseDown={e => this.copyAddress(e)} value={address} readOnly />
                  </div>
                </div>
              </div>
              <div className='signerInfo'>
                <div className='signerBalance'>
                  <span className='signerBalanceCurrency'>Ξ</span>
                  {(balance === undefined ? '-.------' : parseFloat(balance).toFixed(6))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  renderBalances (open) {
    const currentIndex = this.store('main.accounts', this.props.id, 'index')
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    const balance = this.store('balances', address)
    return (
      <div className={open ? 'accountBalances accountBalancesShow' : 'accountBalances accountBalancesHide'}>
        <div className='accountBalance'>
          <div className='accountBalanceCurrency'>Ξ</div>
          <div className='accountBalanceValue'>{(balance === undefined ? '-.------' : parseFloat(balance).toFixed(6))}</div>
        </div>
        <div className='accountBalance'>
          <div className='accountBalanceCurrency'>DAI</div>
          <div className='accountBalanceValue'>{(balance === undefined ? '-.------' : parseFloat(balance).toFixed(6))}</div>
        </div>
      </div>
    )
  }

  renderMenu (open) {
    // let viewIndex = this.store('selected.settings.viewIndex')
    //
    // // FIXME: Ugly hack to allow 'Rename Account' view to slide in from right
    // if (viewIndex === 3) viewIndex = 2
    //
    // const views = this.store('selected.settings.views')
    // const itemWidth = 35
    // const markLeft = (itemWidth * viewIndex) + 'px'
    // const markRight = (((views.length - viewIndex) - 1) * itemWidth) + 'px'
    // return (
    //   <div className='settingsMenu'>
    //     <div className='settingsMenuItems'>
    //       <div className={viewIndex === 0 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(0)}>
    //         <div className='settingsMenuItemIcon' style={{ left: '2px', top: '2px' }}>{svg.octicon('key', { height: 18 })}</div>
    //       </div>
    //       <div className={viewIndex === 1 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(1)}>
    //         <div className='settingsMenuItemIcon'>{svg.octicon('checklist', { height: 22 })}</div>
    //       </div>
    //       <div className={viewIndex === 2 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(2)}>
    //         <div className='settingsMenuItemIcon' style={{ left: '-1px', top: '0px' }}>{svg.octicon('gear', { height: 20 })}</div>
    //       </div>
    //     </div>
    //     <div className='settingsMenuSelect'>
    //       <div className='settingsMenuMark' style={{ left: markLeft, right: markRight }}>
    //         <div className='settingsMenuMarkLine' />
    //       </div>
    //     </div>
    //   </div>
    // )

    return (
      <div className={open ? 'accountMenu accountMenuShow' : 'accountMenu accountMenuHide'}>
        <div className='accountMenuHome'>
          <div className='accountMenuItem' onMouseDown={() => this.store.setAccountView(0)}>{svg.octicon('pulse', { height: 19 })}</div>
        </div>
        <div className='accountMenuSettings'>
          <div className='accountMenuItem' onMouseDown={() => this.store.setAccountView(1)} style={{ paddingRight: '3px' }}>
            {svg.octicon('key', { height: 16 })}
          </div>
          <div className='accountMenuItem' onMouseDown={() => this.store.setAccountView(2)}>
            {svg.octicon('checklist', { height: 18 })}
          </div>
          <div className='accountMenuItem' onMouseDown={() => this.store.setAccountView(3)}>
            {svg.octicon('gear', { height: 17 })}
          </div>
        </div>
      </div>
    )
  }

  renderAccountInfo () {
    const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const open = current && this.store('selected.open')
    const currentIndex = this.store('main.accounts', this.props.id, 'index')
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    const ens = this.store('main.accounts', this.props.id, 'ens', currentIndex)
    return (
      <div className='accountInfo'>
        <Status {...this.props} />
        {ens ? (
          <>
            <div className='accountName'>
              {ens}
            </div>
            <div className='accountNameLocal'>{this.props.name}</div>
          </>
        ) : (
          <>
            <div className='accountName'>
              {address.substring(0, 6)}
              {svg.octicon('kebab-horizontal', { height: 14 })}
              {address.substr(address.length - 4)}
            </div>
            <div className='accountNameLocal' onMouseDown={open ? ::this.typeClick : null}>
              {this.props.name}
            </div>
          </>
        )}
      </div>
    )
  }

  render () {
    const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const open = current && this.store('selected.open')
    const minimized = this.store('selected.minimized')
    this.selected = current && !minimized
    let signerClass = 'signer'
    if (this.props.status === 'ok') signerClass += ' okSigner'
    if (open) signerClass += ' openSigner'
    if (this.store('selected.view') === 'settings') signerClass += ' signerInSettings'
    if (this.store('selected.showAccounts')) signerClass += ' signerAccountExpand'

    const style = {}
    const initial = this.store('selected.position.initial')
    // const scrollTop = this.store('selected.position.scrollTop')
    const shiftTop = this.store('selected.position.shiftTop')

    if (current) {
      // Currently selected
      style.position = 'absolute'
      style.top = initial.top // open ? 40 : initial.top
      style.bottom = initial.bottom // open ? 3 : initial.bottom
      style.left = 0
      style.right = 0
      style.opacity = 1
      style.zIndex = '10000000000000000'
      const panelHeight = document.body.offsetHeight - 50
      style.height = open ? panelHeight : initial.height
      const translateTop = ((initial.top) * -1) + shiftTop
      style.transform = open ? `translateY(${(translateTop) + 'px'})` : 'translateY(0px)'
    } else if (this.store('selected.current') !== '') {
      // Not currently selected, but another signer is
      style.opacity = 1
      style.pointerEvents = 'none'
      style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'
      if (this.store('selected.open')) {
        // Not open, but another signer is
        style.transform = this.props.index > this.store('selected.position.initial.index') ? 'translate(0px, 100px)' : 'translate(0px, -100px)'
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        style.transform = 'translate(0px, 0px)'
        style.opacity = 1
      }
    } else {
      if (this.store('view.addAccount')) {
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        style.transition = '1.48s cubic-bezier(.82,0,.12,1) all'
        style.transitionDelay = '0s'
      }
    }
    // console.log('PLace holder height', (initial.height - 33) + 'px')
    return (
      <div className='signerWrap' style={current ? { height: initial.height + 'px' } : {}} onMouseDown={() => this.closeAccounts()}>
        <div className={signerClass} style={style} ref={ref => { if (ref) this.signer = ref }}>
          <div className='signerContainer' style={current ? { height: '100%' } : {}} onMouseDown={!open ? ::this.typeClick : null}>
            <div className='signerContainerInset'>
              {this.renderAccountInfo(open)}
              {this.renderBalances(open)}
              {this.renderMenu(open)}
              {this.renderViews(open)}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// {current ? (
//   <div className='signerMid' style={open ? {} : { pointerEvents: 'none' }}>
//     <Settings id={this.props.id} />
//     <Requests id={this.props.id} addresses={this.props.addresses} minimized={minimized} status={this.props.status} signer={this.props.signer} />
//   </div>
// ) : null}

// {this.renderType()}
// {this.renderMenu()}
// {this.renderStatus()}

// {current ? this.renderAccountList() : null}
// {current ? (
//   <div className='signerMid' style={open ? { top: '170px' } : { pointerEvents: 'none' }}>
//     <Settings id={this.props.id} />
//     <Requests id={this.props.id} addresses={this.props.addresses} minimized={minimized} status={this.props.status} signer={this.props.signer} />
//   </div>
// ) : null}

// <div className='signerBot' style={open && this.props.signer && this.props.signer.status === 'locked' ? { height: '100px' } : {}}>
//   {current ? (
//     <div className='signerUnlock' style={open && this.props.signer && this.props.signer.status === 'locked' ? { opacity: 1 } : { pointerEvents: 'none' }}>
//       <input className='signerUnlockInput' type='password' value={this.state.unlockInput} onChange={::this.unlockChange} />
//       <div className='signerUnlockSubmit' onMouseDown={::this.unlockSubmit} >{'Unlock'}</div>
//     </div>
//   ) : null}
// </div>

export default Restore.connect(Account)
