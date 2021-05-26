import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

class Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
        }
      })
    }
    this.state = {
      expand: false
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  render () {
    const i = 0
    // const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    // const id = this.store('selected.current')
    // const address = this.store('main.accounts', this.props.id, 'address')
    const permissions = this.store('main.permissions', this.props.id) || {}
    let permissionList = Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1)
    if (!this.state.expand) permissionList = permissionList.slice(0, 3)
    
    return (
      <div ref={this.moduleRef}>
        <div className='moduleHeader'>{'Permissions'}</div>  
        <div className='moduleMain moduleMainPermissions'>
          {permissionList.length === 0 ? (
            <div className='signerPermission'>
              <div className='signerPermissionControls'>
                <div className='signerPermissionOrigin'>No Permissions Set</div>
              </div>
            </div>
          ) : (
            permissionList.map(o => {
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
          {this.state.expand ? (
            <div className='quitFrame'>
              <div onMouseDown={() => {
                link.send('tray:action', 'clearPermissions', this.props.id)
              }} className='quitFrameButton'>Clear All Permissions</div>
            </div>
          ) : null}
        </div>
        <div className='signerBalanceTotal'>
          <div className='signerBalanceShowAll' onMouseDown={() => this.props.expandModule(this.props.moduleId)}>
            {svg.expand(17)}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)