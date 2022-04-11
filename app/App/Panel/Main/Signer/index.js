import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'
import link from '../../../../link'

import Requests from './Requests'
import Settings from './Settings'

// import ledgerLogo from './ledgerLogo.png'
// import trezorLogo from './trezorLogo.png'
// TODO: Rename Signer component to Account

class _Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.state = {
      openActive: false,
      open: false,
      selected: 0,
      shadowTop: 0
    }
    this.mD = this.mouseDetect.bind(this)
  }

  mouseDetect (e) {
    if (this.moduleRef && this.moduleRef.current && !this.moduleRef.current.contains(e.target)) {
      this.setActive(false)
    }
  }

  setActive (active) {
    const { type, id } = this.store('main.currentNetwork')
    if (type !== 'ethereum' || id !== 1) return
    this.setState({ openActive: active })
    this.openTimer = setTimeout(() => this.setState({ open: active }), 480)
    if (active && !this.state.openActive) {
      this.store.clickGuard(true)
      document.addEventListener('mousedown', this.mD)
    } else {
      this.store.clickGuard(false)
      document.removeEventListener('mousedown', this.mD)
    }
  }

  handleScroll (event) {
    this.setState({ shadowTop: event.target.scrollTop })
  }

  renderBalance (known, k, i) {
    const currentIndex = this.store('main.accounts', this.props.id, 'index')
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    const balance = this.store('balances', address)
    const token = known[k]
    return (
      <div className='signerBalance' key={k} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceLogo'>
          <img src={`https://proxy.pylon.link?type=icon&target=${encodeURIComponent(token.logoURI)}`} />
        </div>
        <div className='signerBalanceCurrency'>
          {token.symbol}
        </div>
        <div className='signerBalanceValue' style={(token.displayBalance || '$0').length >= 12 ? { fontSize: '15px', top: '14px' } : {}}>
          {(balance === undefined ? '-.------' : token.displayBalance)}
        </div>
        <div className='signerBalanceEquivalent' style={(token.usdDisplayValue || '$0').length >= 11 ? { fontSize: '10px', top: '15px' } : {}}>
          {token.usdDisplayValue}
        </div>
      </div>
    )
  }

  render () {
    const { open, openActive, selected, shadowTop } = this.state
    let currentIndex = this.store('main.accounts', this.props.id, 'index')
    if (this.props.accountHighlight === 'active') currentIndex = this.props.highlightIndex
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const { type, id } = this.store('main.currentNetwork')
    const currentSymbol = this.store('main.networks', type, id, 'symbol') || 'ETH'
    if (current) {
      const balance = this.store('balances', address)
      const tokens = this.store('main.addresses', address, 'tokens') || {}
      const etherRates = this.store('main.rates')
      const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
      const known = Object.assign({}, tokens.known, {
        default: {
          chainId: 1,
          name: 'Ether',
          decimals: 18,
          address: '0x',
          logoURI: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png?1595348880',
          symbol: currentSymbol,
          balance,
          displayBalance: balance === undefined ? '-.------' : '' + parseFloat(balance).toFixed(6).toLocaleString(),
          floatBalance: parseFloat(balance || 0).toFixed(6),
          usdRate: etherUSD,
          usdValue: Math.floor(parseFloat(balance) * etherUSD),
          usdDisplayValue: '$' + Math.floor(parseFloat(balance) * etherUSD).toLocaleString()
        }
      })
      const knownList = Object.keys(known).sort((a, b) => {
        if (a === 'default') return -1
        if (b === 'default') return 1
        return known[a].usdValue > known[b].usdValue ? -1 : known[a].usdValue < known[b].usdValue ? 1 : 0
      })
      const offsetTop = (selected * 47) + 10
      return (
        <div
          ref={this.moduleRef} className={openActive ? 'signerBalances signerBalancesOpen' : 'signerBalances'} onMouseDown={() => {
            clearTimeout(this.openTimer)
            const o = !this.state.open
            this.setActive(o)
          }}
        >
          <div
            className='signerBalanceSliderInset signerBalanceSliderDisplay' style={openActive && !open ? {
              transition: '0.16s cubic-bezier(.82,0,.12,1) all',
              transform: `translateY(-${shadowTop}px)`
            } : openActive && open ? {
              transition: '0s cubic-bezier(.82,0,.12,1) all',
              transform: `translateY(-${shadowTop}px)`
            } : {
              transition: '0.16s cubic-bezier(.82,0,.12,1) all',
              transform: `translateY(-${offsetTop}px)`
            }}
          >
            {knownList.map((k, i) => this.renderBalance(known, k, i))}
          </div>
          <div className='signerBalanceSlider' style={!open ? { pointerEvents: 'none' } : {}} onScroll={this.handleScroll.bind(this)}>
            <div className='signerBalanceSliderInset signerBalanceSliderShadow'>
              {knownList.map((k, i) => this.renderBalance(known, k, i))}
            </div>
          </div>
          <div className='signerBalanceTotal' onMouseDown={(e) => e.stopPropagation()}>
            <div className='signerBalanceTotalText'>
              <div className='signerBalanceTotalTitle'>
                Total
              </div>
              <div className='signerBalanceTotalValue'>
                {'$' + knownList.map(k => known[k].usdValue).reduce((a, b) => a + b, 0).toLocaleString()}
              </div>
            </div>
          </div>
          {knownList.length <= 1 ? (
            <div className='signerBalanceNoTokens'>
              No other token balances found
            </div>
          ) : null}
        </div>
      )
    } else {
      return null
    }
  }
}
const Balances = Restore.connect(_Balances)

class Signer extends React.Component {
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
      if (this.props.signer && this.store('main.accountCloseLock')) link.rpc('lockSigner', this.props.signer.id, (err, status) => { if (err) return console.log(err) })
    } else {
      const bounds = this.signer.getBoundingClientRect()
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

  renderType () {
    let innerClass = 'signerInner'
    if (this.state.typeActive) innerClass += ' signerInnerActive'
    if (this.state.typeShake) innerClass += ' headShake'
    if (this.store('selected.view') === 'settings') innerClass += ' signerTypeSettings'
    if (!this.props.signer || (this.props.signer && this.props.signer.status === 'initial')) innerClass += ' signerInnerDisconnected'
    const inSettings = this.store('selected.view') === 'settings'
    return (
      <div className='signerType'>
        <div
          className='addressSelect' onMouseDown={e => {
            e.stopPropagation()
            this.store.toggleShowAccounts()
          }}
        >
          <div className='addressSelectButton'>
            <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
            <div className='addressSelectText'>Addresses</div>
            <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
          </div>
        </div>
        {this.state.openHover ? this.renderArrows('up') : null}
        {!this.props.signer || (this.props.signer && this.props.signer.status === 'initial') ? (
          <div className='signerTypeDisconnected' onMouseDown={this.typeClick.bind(this)} style={inSettings ? { transform: 'translateY(-30px)' } : {}} onMouseEnter={() => this.setState({ openHover: true })} onMouseLeave={() => this.setState({ openHover: false })}>
            <div className='signerTypeDisconnectedImageFront'>{svg.logo(24)}</div>
          </div>
        ) : null}
        <div className={innerClass} onMouseDown={this.typeClick.bind(this)} onMouseEnter={() => this.setState({ openHover: true })} onMouseLeave={() => this.setState({ openHover: false })}>
          <div className='signerInset'>
            <div className={`signerImage signerImage-${this.props.type}`}>
              {(_ => {
                if (this.props.signer) {
                  if (this.props.signer.type === 'ledger') return svg.ledger(24)
                  if (this.props.signer.type === 'trezor') return svg.trezor(20)
                  if (this.props.signer.type === 'keystone') return svg.keystone(24)
                  if (this.props.signer.type === 'seed' || this.props.signer.type === 'ring') return svg.flame(21)
                  if (this.props.signer.type === 'aragon') return svg.aragon(32)
                  if (this.props.signer.type === 'lattice') return svg.lattice(32)
                  return svg.octicon('plus', { height: 31 })
                } else {
                  return null
                }
              })()}
            </div>
            <div className='signerText'>{this.props.signer ? (
              this.props.signer.type === 'ring' || this.props.signer.type === 'seed' ? 'hot' : this.props.signer.type
            ) : 'no signer'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderMenu () {
    let menuClass = 'signerMenu'
    menuClass += this.store('selected.view') === 'settings' ? ' signerMenuSettings' : ' signerMenuDefault'
    if (this.store('selected.current') === this.props.id & this.store('selected.open')) menuClass += ' signerMenuOpen'
    return (
      <div className={menuClass}>
        <div className='signerMenuItem signerMenuItemLeft' onMouseDown={() => this.store.setSignerView('default')}>
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
    const { type, id } = this.store('main.currentNetwork')
    const currentSymbol = this.store('main.networks', type, id, 'symbol') || 'ETH'
    return (
      <div className='accountListWrap'>
        <div className='accountList' onMouseDown={e => e.stopPropagation()}>
          <div className='accountListItems'>
            {this.store('main.accounts', this.props.id, 'addresses').slice(startIndex, startIndex + 5).map((a, i) => {
              i = startIndex + i
              const balance = this.store('balances', a)
              return (
                <div
                  key={i}
                  className={i === highlight ? 'accountListItem accountListItemSelected' : 'accountListItem'}
                  onMouseDown={() => this.setSignerIndex(i)}
                  onMouseEnter={() => this.setHighlight('active', i)}
                  onMouseLeave={() => this.setHighlight('inactive', i)}
                >
                  <div className='accountListItemCheck'>{svg.octicon('check', { height: 27 })}</div>
                  <div className='accountListItemAddress'>{a ? a.substring(0, 6) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{a ? a.substr(a.length - 4) : ''}</div>
                  <div className='accountListItemBalance'>{currentSymbol + ' ' + (balance === undefined ? '-.------' : parseFloat(balance).toFixed(6))}</div>
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

  renderStatus () {
    // let open = current && this.store('selected.open')
    // TODO: Set Signer Name
    let currentIndex = this.store('main.accounts', this.props.id, 'index')
    const status = this.props.status.charAt(0).toUpperCase() + this.props.status.substr(1)
    if (this.state.accountHighlight === 'active') currentIndex = this.state.highlightIndex
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
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
                  <div className='transactionToAddressLarge'>{address.substring(0, 10)} {svg.octicon('kebab-horizontal', { height: 20 })} {address.substr(address.length - 10)}</div>
                  <div className='transactionToAddressFull'>
                    {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : address}
                    <input tabIndex='-1' onMouseDown={e => this.copyAddress(e)} value={address} readOnly />
                  </div>
                </div>
              </div>
              <div className='signerInfo'>
                <Balances {...this.props} highlightIndex={this.state.highlightIndex} accountHighlight={this.state.accountHighlight} />
              </div>
            </div>
          </div>
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

    if (current) {
      // Currently selected
      style.position = 'absolute'
      style.top = initial.top // open ? 40 : initial.top
      style.bottom = initial.bottom // open ? 3 : initial.bottom
      style.left = 0
      style.right = 0
      style.zIndex = '1000000000000'
      const panelHeight = document.body.offsetHeight
      style.height = open ? panelHeight - 48 : initial.height - 3
      style.transform = open ? `translateY(-${initial.top - 44}px)` : 'translateY(0px)'
    } else if (this.store('selected.current') !== '') {
      // Not currently selected, but another signer is
      style.opacity = 0
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
    return (
      <div className='signerWrap' style={current ? { height: initial.height + 'px' } : {}} onMouseDown={() => this.closeAccounts()}>
        <div className={signerClass} style={style} ref={ref => { if (ref) this.signer = ref }}>
          <div className='signerContainer' style={current ? { height: '100%' } : {}}>
            {this.store('view.clickGuard') ? <div className='clickGuard' /> : null}
            <div className='signerTop'>
              <div className='signerNav'> {this.renderMenu()} {this.renderType()} </div>
              {this.renderStatus()}
            </div>
            {current ? this.renderAccountList() : null}
            {current ? (
              <div className='signerMid' style={open ? { top: '170px' } : { pointerEvents: 'none' }}>
                <Settings id={this.props.id} />
                <Requests id={this.props.id} addresses={this.props.addresses} minimized={minimized} status={this.props.status} signer={this.props.signer} />
              </div>
            ) : null}
            <div className='signerBot' />
          </div>
        </div>
      </div>
    )
  }
}

// <div className='signerBot' style={open && this.props.signer && this.props.signer.status === 'locked' ? { height: '100px' } : {}}>
//   {current ? (
//     <div className='signerUnlock' style={open && this.props.signer && this.props.signer.status === 'locked' ? { opacity: 1 } : { pointerEvents: 'none' }}>
//       <input className='signerUnlockInput' type='password' value={this.state.unlockInput} onChange={this.unlockChange.bind(this)} />
//       <div className='signerUnlockSubmit' onMouseDown={this.unlockSubmit.bind(this)} >{'Unlock'}</div>
//     </div>
//   ) : null}
// </div>

export default Restore.connect(Signer)
