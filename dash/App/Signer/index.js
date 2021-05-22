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
      latticePairCode: ''
    }
  }

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
          <div className='signerType'>{this.props.type + ' Signer'}</div>
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