import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../link'

class Permissions extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      verifyAddressSuccess: false,
      verifyAddressResponse: ''
    }
  }

  verifyAddress () {
    link.rpc('verifyAddress', (err, res) => {
      if (err) {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: err })
      } else {
        this.setState({ verifyAddressSuccess: true, verifyAddressResponse: 'Address matched!' })
      }
      setTimeout(() => {
        this.setState({ verifyAddressSuccess: false, verifyAddressResponse: '' })
      }, 5000)
    })
  }

  render () {
    const id = this.store('selected.current')
    const currentIndex = this.store('main.accounts', id, 'index')
    console.log(this.props.id)
    const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
    console.log(address)
    const permissions = this.store('main.addresses', address, 'permissions') || {}
    return (
      <div className='signerSlide'>
        <div className='signerSettingsTitle'>Dapp Permissions</div>
        {Object.keys(permissions).length === 0 ? (
          <div className='signerPermission'>
            <div className='signerPermissionControls'>
              <div className='signerPermissionOrigin'>No Permissions Set</div>
            </div>
          </div>
        ) : (
          Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1).map(o => {
            return (
              <div className='signerPermission' key={o} onMouseDown={_ => link.send('tray:toggleAccess', address, o)}>
                <div className='signerPermissionControls'>
                  <div className='signerPermissionOrigin'>{permissions[o].origin}</div>
                  <div className={permissions[o].provider ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}>
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div className='quitFrame'>
          <div onMouseDown={() => link.send('tray:clearPermissions', address)} className='quitFrameButton'>Clear All Permissions</div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Permissions)
