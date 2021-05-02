import React from 'react'
import Restore from 'react-restore'

import link from '../../../resources/link'
import svg from '../../../resources/svg'

class Signer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      page: 0,
      addressLimit: 4
    }
  }
  status () {
    if (this.props.status === 'ok') {
      return (
        <div className='signerStatus'>
          <div className='signerStatusText'>{'ready'}</div>
          <div className='signerStatusIndicator signerStatusIndicatorReady'></div>
        </div>
      )
    } else if (this.props.status === 'locked') {
      return (
        <div className='signerStatus'>
          <div className='signerStatusText'>{'locked'}</div>
          <div className='signerStatusIndicator signerStatusIndicatorLocked'></div>
        </div>
      )
    } else {
      return (
        <div className='signerStatus'>
          <div className='signerStatusText'>{this.props.status}</div>
          <div className='signerStatusIndicator'></div>
        </div>
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

  render () {
    const signer = this.store('main.signers', this.props.id)
    const { page, addressLimit } = this.state
    const startIndex = page * addressLimit

    const activeAccounts = signer.addresses.filter(a => this.store('main.accounts', a.toLowerCase()))

    return (
      <div className='signer'>
        <div className='signerTop'>
          <div className='signerType'>{this.props.type + ' Signer'}</div>
          <div className='signerName'>{'Signer Name'}</div>
          {this.status()}
        </div>
        <div className='signerAccountsTitle'>
          <span>{'Add & Remove Accounts'}</span>
          <span className={activeAccounts.length > 0 ? 'signerAccountsTitleActive signerAccountsTitleActiveOn' : 'signerAccountsTitleActive'}>
            <span className='signerAccountsTitleActiveCount'>{activeAccounts.length}</span> 
            <span>{'active'}</span> 
          </span>
        </div>
        <div className='signerAccounts'>{signer.addresses.slice(startIndex, startIndex + addressLimit).map((address, index) => {
          const added = this.store('main.accounts', address.toLowerCase())
          return (
            <div className={!added ?  'signerAccount' : 'signerAccount signerAccountAdded'} onMouseDown={() => {
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
              <div className='signerAccountAddress'>{address.substr(0, 9)} {svg.octicon('kebab-horizontal', { height: 20 })} {address.substr(0, 8)}</div>
              <div className='signerAccountCheck'>{svg.check(22)}</div>
            </div>
          )
        })}</div>
        <div className='signerBottom'>
          <div className='signerBottomPageBack' onMouseDown={() => this.nextPage(true)}>{svg.triangleLeft(20)}</div>
          <div className='signerBottomPages'>{(page + 1) + ' / ' + Math.ceil(signer.addresses.length / addressLimit)}</div>
          <div className='signerBottomPageNext' onMouseDown={() => this.nextPage()}>{svg.triangleLeft(20)}</div>
        </div>
        
      </div>
    )
  }
}

export default Restore.connect(Signer)