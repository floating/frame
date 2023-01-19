import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../resources/svg'
import link from '../../../../resources/link'
import { getAddress } from '../../../../resources/utils'

class Account extends React.Component {
  constructor(...args) {
    super(...args)
    this.locked = false
    this.state = {
      typeHover: false,
      accountHighlight: 'default',
      highlightIndex: 0,
      unlockInput: '',
      openHover: false,
      addressHover: false
    }
  }

  componentDidMount() {
    if (this.props.index === 0) this.props.resetScroll()
    window.addEventListener('scroll', this.onScroll.bind(this), true)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll.bind(this), true)
  }

  onScroll() {
    this.setState({ addressHover: false, copied: false })
  }

  copyAddress() {
    link.send('tray:clipboardData', getAddress(this.props.id))
    this.setState({ copied: true })
    setTimeout(() => this.setState({ copied: false }), 1800)
  }

  unlockChange(e) {
    this.setState({ unlockInput: e.target.value })
  }

  unlockSubmit() {
    link.rpc('unlockSigner', this.props.id, this.state.unlockInput, () => {})
  }

  trezorPin(num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }

  submitPin() {
    link.rpc('trezorPin', this.props.id, this.state.tPin, () => {})
    this.setState({ tPin: '' })
  }

  backspacePin(e) {
    e.stopPropagation()
    this.setState({ tPin: this.state.tPin ? this.state.tPin.slice(0, -1) : '' })
  }

  select() {
    if (this.store('selected.current') === this.props.id) {
      link.rpc('unsetSigner', this.props.id, (err) => {
        if (err) return console.log(err)
      })
      if (this.props.signer && this.store('main.accountCloseLock'))
        link.rpc('lockSigner', this.props.signer, (err) => {
          if (err) return console.log(err)
        })
    } else {
      const bounds = this.signer.getBoundingClientRect()
      this.props.reportScroll()
      this.store.initialSignerPos({
        top: bounds.top - 80,
        bottom: document.body.clientHeight - bounds.top - this.signer.clientHeight + 3,
        height: this.signer.clientHeight + 6,
        index: this.props.index
      })
      link.rpc('setSigner', this.props.id, (err) => {
        if (err) return console.log(err)
      })
    }
  }

  renderTrezorPin(active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        <div className='trezorPinInput'>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
              {svg.octicon('primitive-dot', { height: 20 })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  setSignerStatusOpen(value) {
    link.send('tray:action', 'setAccountSignerStatusOpen', value)
  }

  typeClick() {
    if (this.props.status === 'ok') {
      this.select()
      this.setState({ typeActive: true })
      setTimeout(() => this.setState({ typeActive: false }), 110)
      setTimeout(() => this.setSignerStatusOpen(true), 800)
    } else {
      this.setSignerStatusOpen(false)
      this.setState({ typeShake: true })
      setTimeout(() => this.setState({ typeShake: false }), 1010)
    }
  }

  renderSignerIndicator() {
    let accountIndicatorClass = 'accountIndicator'
    if (this.props.signer) {
      const signer = this.store('main.signers', this.props.signer) || {}
      if (signer.status === 'locked') {
        accountIndicatorClass += ' accountIndicatorLocked'
      } else if (signer.status === 'ok') {
        accountIndicatorClass += ' accountIndicatorGood'
      }
    }
    return <div className={accountIndicatorClass} />
  }

  isHotSigner(lastSignerType) {
    return ['seed', 'ring'].includes(lastSignerType)
  }

  renderType() {
    const current = this.store('selected.current') === this.props.id && this.props.status === 'ok'
    const open = current && this.store('selected.open')
    const signerStatusOpen = current && this.store('selected.signerStatusOpen')
    const isHotSigner = this.isHotSigner(this.props.lastSignerType)

    return (
      <div
        className={!isHotSigner ? 'signerType' : 'signerType signerTypeHot'}
        onMouseDown={() => {
          if (open) this.setSignerStatusOpen(!signerStatusOpen)
        }}
      >
        {((_) => {
          const type = this.props.lastSignerType
          if (type === 'ledger')
            return <div className='signerSelectIconWrap signerIconLedger'>{svg.ledger(24)}</div>
          if (type === 'trezor')
            return <div className='signerSelectIconWrap signerIconTrezor'>{svg.trezor(24)}</div>
          if (type === 'seed' || type === 'ring')
            return <div className='signerSelectIconWrap'>{svg.flame(25)}</div>
          if (type === 'lattice')
            return <div className='signerSelectIconWrap signerIconSmart'>{svg.lattice(26)}</div>
          return <div className='signerSelectIconWrap'>{svg.logo(22)}</div>
        })()}
      </div>
    )
  }

  renderMenu() {
    let menuClass = 'signerMenu'
    menuClass += this.store('selected.view') === 'settings' ? ' signerMenuSettings' : ' signerMenuDefault'
    if ((this.store('selected.current') === this.props.id) & this.store('selected.open'))
      menuClass += ' signerMenuOpen'
    return (
      <div className={menuClass}>
        <div
          className='signerMenuItem signerMenuItemLeft'
          onMouseDown={() => this.store.setSignerView('default')}
        >
          <div className='signerMenuItemIcon'>
            {svg.octicon('pulse', { height: 23 })}
            <div className='iconUnderline' />
          </div>
        </div>
        <div
          className='signerMenuItem signerMenuItemRight'
          onMouseDown={() => this.store.setSignerView('settings')}
        >
          <div className='signerMenuItemIcon'>
            {svg.octicon('settings', { height: 23 })}
            <div className='iconUnderline' />
          </div>
        </div>
      </div>
    )
  }

  setHighlight(mode, index) {
    if (!this.locked) this.setState({ accountHighlight: mode, highlightIndex: index || 0 })
  }

  closeAccounts() {
    if (this.store('selected.showAccounts')) this.store.toggleShowAccounts(false)
  }

  setSignerIndex(index) {
    this.locked = true
    link.rpc('setSignerIndex', index, (err) => {
      this.setState({ accountHighlight: 'inactive', highlightIndex: 0 })
      this.store.toggleShowAccounts(false)
      setTimeout(() => {
        this.locked = false
      }, 1000)
      if (err) return console.log(err)
    })
  }

  getAddressSize() {
    const ensName = this.store('main.accounts', this.props.id, 'ensName')
    if (ensName) {
      if (ensName.length <= 13) {
        return 17
      } else {
        let size = 17 - (ensName.length - 13)
        if (size < 8) size = 8
        return size
      }
    } else {
      return 17
    }
  }

  renderDetails() {
    const { address, ensName } = this.store('main.accounts', this.props.id)
    const showLocal = this.store('main.showLocalNameWithENS')
    const formattedAddress = getAddress(address)

    let requests = this.store('main.accounts', this.props.id, 'requests') || {}
    requests = Object.keys(requests).filter((r) => requests[r].mode === 'normal')

    if (this.state.addressHover) {
      return (
        <div
          className='signerDetailsFullAddress'
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            if (this.state.addressHover) this.copyAddress()
          }}
        >
          {this.state.copied ? (
            <div className='signerDetailsFullAddressCopied'>
              {svg.copy(16)}
              <span>{'Address Copied'}</span>
            </div>
          ) : (
            <div className='signerDetailsFullAddressText'>{formattedAddress}</div>
          )}
        </div>
      )
    } else {
      if (ensName && !showLocal) {
        return (
          <div className='signerDetails'>
            <div
              className='signerDetailsENSName'
              onMouseOver={(e) => {
                e.stopPropagation()
                e.preventDefault()
                this.setState({ addressHover: true })
              }}
              onMouseLeave={(e) => {
                e.stopPropagation()
                e.preventDefault()
                this.setState({ addressHover: false, copied: false })
              }}
              style={{ fontSize: this.getAddressSize() + 'px' }}
            >
              {ensName}
            </div>
          </div>
        )
      } else {
        return (
          <div className='signerDetails'>
            <div className='signerDetailsName'>{this.props.name}</div>
            <div
              className='signerDetailsAddress'
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                this.setState({ addressHover: true })
              }}
              onMouseOver={(e) => {
                e.stopPropagation()
                e.preventDefault()
                this.addressTimeout = setTimeout(() => {
                  this.setState({ addressHover: true })
                }, 500)
              }}
              onMouseLeave={(e) => {
                e.stopPropagation()
                e.preventDefault()
                clearTimeout(this.addressTimeout)
                this.setState({ addressHover: false, copied: false })
              }}
            >
              {ensName ? (
                <div className='signerDetailsAddressPart'>{ensName}</div>
              ) : (
                <>
                  <div className='signerDetailsAddressPart'>{formattedAddress.substring(0, 5)}</div>
                  <div className='signerDetailsAddressDivide'>{svg.ellipsis(16)}</div>
                  <div className='signerDetailsAddressPart'>
                    {formattedAddress.substr(formattedAddress.length - 3)}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      }
    }
  }

  renderStatus() {
    const { address, ensName } = this.store('main.accounts', this.props.id)
    const formattedAddress = getAddress(address)

    let requests = this.store('main.accounts', this.props.id, 'requests') || {}
    requests = Object.keys(requests).filter((r) => requests[r].mode === 'normal')

    return this.props.status !== 'ok' ? (
      <div className='signerStatusNotOk'>{status}</div>
    ) : (
      <>
        {!this.state.addressHover ? (
          <div className='signerName'>
            <div
              className={!ensName || !this.props.name ? 'signerNameText' : 'signerNameText signerNameTextENS'}
            >
              {this.props.name}
            </div>
          </div>
        ) : null}
        <div className={'signerAddress'}>
          <div
            className='transactionToAddress'
            onClick={() => {
              if (this.state.addressHover) {
                this.copyAddress()
              }
            }}
          >
            <div className='transactionToAddressLargeWrap'>
              {!this.state.addressHover ? (
                ensName ? (
                  <div
                    className='transactionToAddressLarge transactionToAddressENS'
                    style={{ fontSize: this.getAddressSize() + 'px' }}
                    onClick={() => {
                      if (!this.state.addressHover) {
                        this.setState({ addressHover: true })
                      }
                    }}
                  >
                    {ensName}
                  </div>
                ) : (
                  <div
                    className={
                      this.props.name
                        ? 'transactionToAddressLarge'
                        : 'transactionToAddressLarge transactionToAddressENS'
                    }
                    onClick={() => {
                      if (!this.state.addressHover) {
                        this.setState({ addressHover: true })
                      }
                    }}
                  >
                    <div>{formattedAddress.substring(0, 5)}</div>
                    <div className='transactionToAddressLargeEllipsis'>{svg.ellipsis(16)}</div>
                    <div>{formattedAddress.substr(formattedAddress.length - 3)}</div>
                  </div>
                )
              ) : null}
            </div>
            <div
              className={
                this.state.addressHover
                  ? 'transactionToAddressFull'
                  : 'transactionToAddressFull transactionToAddressFullHidden'
              }
            >
              {this.state.copied ? (
                <span className='transactionToAddressFullCopied'>{'Address Copied'}</span>
              ) : (
                formattedAddress
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  render() {
    const { id, status, active, index } = this.props

    const selectedAccountId = this.store('selected.current')
    const open = this.store('selected.open')
    const minimized = this.store('selected.minimized')
    const selectedView = this.store('selected.view')
    const showAccounts = this.store('selected.showAccounts')
    const initialPosition = this.store('selected.position.initial')
    const initialIndex = this.store('selected.position.initial.index')
    const isAddAccountView = this.store('view.addAccount')

    const current = selectedAccountId === id && status === 'ok'
    const selectedAccountOpen = current && open

    this.selected = current && !minimized
    let signerClass = 'signer'
    if (status === 'ok') signerClass += ' okSigner'
    if (selectedAccountOpen) signerClass += ' openSigner'
    if (selectedView === 'settings') signerClass += ' signerInSettings'
    if (showAccounts) signerClass += ' signerAccountExpand'

    let signerTopClass = active ? 'signerTop signerTopActive' : 'signerTop'

    const style = {}

    if (current) {
      // Currently selected
      style.position = 'absolute'
      style.top = initialPosition.top // open ? 40 : initial.top
      style.bottom = initialPosition.bottom // open ? 3 : initial.bottom
      style.left = '6px'
      style.right = '6px'
      style.zIndex = '100000000'
      style.height = initialPosition.height - 6
      style.transform = selectedAccountOpen ? `translateY(${initialPosition.top * -1}px)` : 'translateY(0px)'
    } else if (selectedAccountId !== '') {
      // Not currently selected, but another signer is
      style.pointerEvents = 'none'
      style.transition = '300ms cubic-bezier(.82,0,.12,1) all'
      if (open) {
        signerTopClass += ' signerTopNoHover'
        // Not open, but another signer is
        style.transform = index > initialIndex ? 'translate(0px, 100px)' : 'translate(0px, -20px)'
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        // style.transition = '400ms linear all'
        style.transform = 'translate(0px, 0px)'
        // style.transitionDelay = '400ms'
        style.opacity = 1
      }
    } else {
      if (isAddAccountView) {
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        style.transition = '1.48s cubic-bezier(.82,0,.12,1) all'
        style.transitionDelay = '0s'
      }
    }

    let requests = this.store('main.accounts', id, 'requests') || {}
    requests = Object.keys(requests).filter((r) => requests[r].mode === 'normal')

    return (
      <div
        className='signerWrap'
        style={current ? { height: initialPosition.height + 'px' } : {}}
        onMouseDown={() => this.closeAccounts()}
        onMouseLeave={() => {
          this.setState({ addressHover: false, copied: false })
        }}
      >
        <div
          className={signerClass}
          style={style}
          ref={(ref) => {
            if (ref) this.signer = ref
          }}
        >
          <div
            className={signerTopClass}
            style={selectedAccountOpen ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0)' } : {}}
            // onMouseEnter={() => this.setState({ openHover: true })}
            // onMouseLeave={() => this.setState({ openHover: false })}
            onClick={() => {
              if (!selectedAccountOpen) this.typeClick()
            }}
          >
            {!this.state.addressHover ? (
              <>
                {this.renderSignerIndicator()}
                {this.renderType()}
                {/* <div className='accountGrabber' style={open ? { opacity: 0, pointerEvents: 'none' } : {}}>
                  {svg.grab(35)}
                </div> */}
                {(() => {
                  if (this.state.addressHover) return null
                  let requestBadgeClass = 'accountNotificationBadge'
                  if (active) requestBadgeClass += ' accountNotificationBadgeReady'
                  if (requests.length > 0) requestBadgeClass += ' accountNotificationBadgeActive'
                  return (
                    <div className={requestBadgeClass}>
                      <span>{requests.length}</span>
                    </div>
                  )
                })()}
                <div className='signerSelect' onClick={this.typeClick.bind(this)}>
                  <div className='signerSelectButton'>
                    <div className='signerSelectIconWrap'>
                      <div
                        className='signerSelectIcon'
                        style={{ transform: selectedAccountOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        {svg.chevron(26)}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
            {/* {this.renderStatus()} */}
            {this.renderDetails()}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Account)
