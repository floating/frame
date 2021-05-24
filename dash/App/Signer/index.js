import React from 'react'
import Restore from 'react-restore'

import link from '../../../resources/link'
import svg from '../../../resources/svg'

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      page: 0,
      addressLimit: 4,
      latticePairCode: '',
      tPin: ''
    }
  }

  backspacePin (e) {
    e.stopPropagation()
    this.setState({ tPin: this.state.tPin ? this.state.tPin.slice(0, -1) : '' })
  }

  trezorPin (num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }

  submitPin () {
    link.rpc('trezorPin', this.props.id, this.state.tPin, () => {})
    this.setState({ tPin: '' })
  }

  submitPhrase () {
    link.rpc('trezorPhrase', this.props.id, this.state.tPhrase, () => {})
    this.setState({ tPhrase: '' })
  }

  renderLoadingLive () {
    if (this.props.type === 'ledger' && this.props.status.toLowerCase() === 'deriving live addresses') {
      const liveAccountLimit = this.store('main.ledger.liveAccountLimit')
      const styleWidth = liveAccountLimit === 20 ? 120 : liveAccountLimit === 40 ? 120 : 60
      const marginTop = liveAccountLimit === 40 ? -8 : 0
      return (
        <div className='loadingLiveAddresses' style={{ top: `${marginTop}px`, padding: '20px', width: `${styleWidth}px` }}>
          {[...Array(liveAccountLimit).keys()].map(i => i + 1).map(i => {
            return <div key={'loadingLiveAddress' + i} className='loadingLiveAddress' style={{ opacity: i <= this.props.liveAddressesFound ? '1' : '0.3' }} />
          })}
        </div>
      )
    } else {
      return null
    }
  }

  renderTrezorPin (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        {active ? (
          <>
            <div className='trezorPhraseInput'>
              {this.state.tPin.split('').map((n, i) => {
                return (
                  <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
                    {svg.octicon('primitive-dot', { height: 14 })}
                  </div>
                )
              })}
            </div>
            <div className='signerPinMessage signerPinSubmit' onMouseDown={this.state.tPin ? () => this.submitPin() : null}>
              Submit Pin
              {this.state.tPin ? (
                <div className='signerPinDelete' onMouseDown={this.backspacePin.bind(this)}>
                  {svg.octicon('chevron-left', { height: 18 })}
                </div>
              ) : null}
            </div>
            <div className='trezorPinInputWrap'>
              <div className='trezorPinInput'>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                  <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
                    {svg.octicon('primitive-dot', { height: 20 })}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    )
  }

  phraseKeyPress (e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      this.submitPhrase()
    }
  }

  renderTrezorPhrase (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        {active ? (
          <>
            <div className='trezorPhraseInput'>
              <input type='password' onChange={(e) => this.setState({ tPhrase: e.target.value })} onKeyPress={e => this.phraseKeyPress(e)} autoFocus />
            </div>
            <div className='signerPinMessage signerPinSubmit' onMouseDown={() => this.submitPhrase()}>
              Submit Passphrase
            </div>
          </>
        ) : null}
      </div>
    )
  }

  // render () {
  //   const open = this.store('selected.open')
  //   const style = {}
  //   if (open) {
  //     style.opacity = 0
  //     style.pointerEvents = 'none'
  //     style.transform = 'translate(0px, -100px)'
  //   }
  //   if (this.props.type === 'trezor' && this.props.status === 'Need Pin') style.height = '300px'
  //   if (this.props.type === 'trezor' && this.props.status === 'Enter Passphrase') style.height = '180px'

  //   style.transition = '0.48s cubic-bezier(.82,0,.12,1) all'

  //   const status = this.props.status ? this.props.status.charAt(0).toUpperCase() + this.props.status.substring(1) : ''

  //   return (
  //     <div className='pendingSignerWrap' style={style}>
  //       <div className='pendingSignerInset'>
  //         <div className='pendingSignerTop'>
  //           {this.renderLoadingLive()}
  //           <div className='pendingSignerLogo'>
  //             {this.props.type === 'ledger' && (
  //               <div style={{ marginTop: '4px' }}>
  //                 {svg.ledger(25)}
  //               </div>
  //             )}
  //             {this.props.type === 'trezor' && (
  //               svg.trezor(25)
  //             )}
  //             {this.props.type === 'lattice' && (
  //               svg.lattice(25)
  //             )}
  //           </div>
  //           <div className='pendingSignerText'>
  //             <div className='pendingSignerType'>{this.props.type + ' Found'}</div>
  //             <div className='pendingSignerStatus'>{status}</div>
  //           </div>
  //         </div>
  //         <div className='signerInterface'>
  //           {this.renderTrezorPin(this.props.type === 'trezor' && this.props.status === 'Need Pin')}
  //           {this.renderTrezorPhrase(this.props.type === 'trezor' && this.props.status === 'Enter Passphrase')}
  //         </div>
  //       </div>
  //     </div>
  //   )

  status () {
    if (this.props.status === 'ok') {
      return (
        <div className='signerStatus'>
          <div className='signerStatusIndicator signerStatusIndicatorReady'></div>
        </div>
      )
    } else if (this.props.status === 'locked') {
      return (
        <div className='signerStatus'>
          <div className='signerStatusIndicator signerStatusIndicatorLocked'></div>
        </div>
      )
    } else {
      return (
        <div className='signerStatus'>
          <div className='signerStatusIndicator'></div>
        </div>
      )
    }
  }

  statusText () {
    if (this.props.status === 'ok') {
      return (
        <div className='signerStatusText signerStatusReady'>{'ready to use'}</div>
      )
    } else if (this.props.status === 'locked') {
      return (
        <div className='signerStatusText signerStatusIssue'>{'locked'}</div>
      )
    } else if (this.props.status === 'addresses') {
      return (
        <div className='signerStatusText'>{'getting addresses'}</div>
      )
    } else {
      return (
        <div className='signerStatusText'>{this.props.status}</div>
      )
    }
  }

  nextPage (backwards) {
    let page = backwards ? this.state.page - 1 : this.state.page + 1
    const signer = this.store('main.signers', this.props.id)
    const maxPage = Math.ceil(signer.addresses.length / this.state.addressLimit) - 1
    if (page > maxPage) page = maxPage
    if (page < 0) page = 0
    this.setState({ page })
  }

  pairToLattice () {
    link.rpc('latticePair', this.props.id, this.state.latticePairCode, (err, accounts) => {
      if (err) {
        this.setState({ status: err, error: true })
      } else {
        this.setState({ status: 'Adding Accounts', index: 2, error: false }) 
      }
    })
  }

  render () {
    const signer = this.store('main.signers', this.props.id)
    const { page, addressLimit } = this.state
    const startIndex = page * addressLimit

    const activeAccounts = signer.addresses.filter(a => this.store('main.accounts', a.toLowerCase()))

    return (
      <div className='signer' style={{ zIndex: 1000 - this.props.index }}>
        <div className='signerTop'>
          <div className='signerIcon'>
          {(_ => {
            const type = this.props.type
            if (type === 'ledger') return <div className='signerIconWrap signerIconHardware'>{svg.ledger(20)}</div>
            if (type === 'trezor') return <div className='signerIconWrap signerIconHardware'>{svg.trezor(20)}</div>
            if (type === 'seed' || type === 'ring') return <div className='signerIconWrap signerIconHot'>{svg.flame(23)}</div>
            if (type === 'aragon') return <div className='signerIconWrap signerIconSmart'>{svg.aragon(28)}</div>
            if (type === 'lattice') return <div className='signerIconWrap signerIconSmart'>{svg.lattice(22)}</div>
            return <div className='signerIconWrap'>{svg.logo(20)}</div>
          })()}
          </div>
          <div className='signerType'>{this.props.type}</div>
          <div className='signerName'>
            {'Signer Name'}
            <div className='signerNameUpdate'>
              {svg.save(14)}
            </div>
          </div>
          {this.status()}
        </div>
        {this.statusText()}
        {this.props.type === 'lattice' && this.props.status === 'pairing' ? (
          <div className='signerLatticePair'>
            <div className='signerLatticePairTitle'>Please input your Lattice's pairing code</div>
            <div className='signerLatticePairInput'>
              <div className=''>
                <input
                  tabIndex='1' value={this.state.pairCode}
                  onChange={e => this.setState({ latticePairCode: e.target.value })}
                  // onFocus={e => this.onFocus('pairCode', e)}
                  // onBlur={e => this.onBlur('pairCode', e)} 
                  onKeyPress={e => {
                    if (e.key === 'Enter') this.pairToLattice()
                  }}
                />
              </div>
              <div>
              </div>
            </div>
            <div
              onMouseDown={() => this.pairToLattice()}
              className='signerLatticePairSubmit'
            >Pair</div>
          </div>
        ) : this.props.status === 'ok' || this.props.status === 'locked' ? (
          <>
            <div className='signerAccountsTitle'>
              <span className={activeAccounts.length > 0 ? 'signerAccountsTitleActive signerAccountsTitleActiveOn' : 'signerAccountsTitleActive'}>
                <span>{'active accounts'}</span> 
                <span className='signerAccountsTitleActiveCount'>{activeAccounts.length}</span> 
              </span>
            </div>
            <div className='signerAccounts'>{signer.addresses.slice(startIndex, startIndex + addressLimit).map((address, index) => {
              const added = this.store('main.accounts', address.toLowerCase())
              return (
                <div key={address} className={!added ?  'signerAccount' : 'signerAccount signerAccountAdded'} onMouseDown={() => {
                  if (this.store('main.accounts', address.toLowerCase())) {
                    link.rpc('removeAccount', address, {}, () => {
                      // console.log('Removed account ', address)
                    })
                  } else {
                    link.rpc('createAccount', address, { type: signer.type }, () => {
                      // console.log('Added account ', address)
                    })
                  }
                }}>
                  <div className='signerAccountIndex'>{index + 1 + startIndex}</div>
                  <div className='signerAccountAddress'>{address.substr(0, 11)} {svg.octicon('kebab-horizontal', { height: 20 })} {address.substr(address.length - 10)}</div>
                  <div className='signerAccountCheck'>{svg.check(22)}</div>
                </div>
              )
            })}</div>
            <div className='signerBottom'>
              <div className='signerBottomPageBack' onMouseDown={() => this.nextPage(true)}>{svg.triangleLeft(20)}</div>
              <div className='signerBottomPages'>{(page + 1) + ' / ' + Math.ceil(signer.addresses.length / addressLimit)}</div>
              <div className='signerBottomPageNext' onMouseDown={() => this.nextPage()}>{svg.triangleLeft(20)}</div>
            </div>
          </>
        ) : this.props.type === 'trezor' && (this.props.status === 'Need Pin' || this.props.status === 'Enter Passphrase') ? (
          <div className='signerInterface'>
            {this.renderTrezorPin(this.props.type === 'trezor' && this.props.status === 'Need Pin')}
            {this.renderTrezorPhrase(this.props.type === 'trezor' && this.props.status === 'Enter Passphrase')}
          </div> 
        ) : (
          <div className='signerLoading'>
            <div className='signerLoadingLoader' />
          </div>
        )}
        <div className='signerDrawer' onMouseDown={() => this.setState({ showControls: !this.state.showControls })}>
          <div className='showControls'>
            {this.state.showControls ? 'hide' : 'settings'}
          </div>
          <div className='showControlsLine' />
        </div>
        {this.state.showControls ? (
          <div className='signerControls cardShow'>
            <div className='signerControlOption'>Deactivte Accounts</div>
            <div className='signerControlOption signerControlOptionImportant' onMouseDown={() => {
              link.send('dash:removeSigner', this.props.id)
            }}>Remove Signer</div>
            </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Signer)