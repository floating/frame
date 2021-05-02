import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })
    this.state = {
      expand: false
    }
  }
  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  } 
  render () {
    const i = 0
    // const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    // const id = this.store('selected.current')
    // const address = this.store('main.accounts', this.props.id, 'address')
    const permissions = this.store('main.permissions', this.props.id) || {}
    
    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>{'Account Permissions'}</div>  
        <div className='moduleMain'>
          {Object.keys(permissions).length === 0 ? (
            <div className='signerPermission'>
              <div className='signerPermissionControls'>
                <div className='signerPermissionOrigin'>No Permissions Set</div>
              </div>
            </div>
          ) : (
            Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1).map(o => {
              return (
                <div className='signerPermission' key={o} onMouseDown={_ => link.send('tray:action', 'toggleAccess', this.props.id, o)}>
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
            <div onMouseDown={() => link.send('tray:action', 'clearPermissions', address)} className='quitFrameButton'>Clear All Permissions</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)