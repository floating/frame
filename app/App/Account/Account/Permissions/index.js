import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

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
    const permissions = this.store('main.permissions', this.props.account) || {}
    let permissionList = Object.keys(permissions).sort((a, b) => a.origin < b.origin ? -1 : 1)
    if (!this.props.expanded) permissionList = permissionList.slice(0, 3)
    
    return (
      <div 
        className='balancesBlock'
        ref={this.moduleRef}
      >
        {!this.props.expanded ? (
          <div className='moduleHeader'>
            <span>{svg.key(14)}</span>
            <span>{'Permissions'}</span>
          </div>
        ) : null}
        <div className='moduleMainPermissions'>
          {permissionList.length === 0 ? (
            <div className='signerPermission'>
              <div className='signerPermissionControls'>
                <div className='signerPermissionNoPermissions'>No Permissions Set</div>
              </div>
            </div>
          ) : (
            permissionList.map(o => {
              return (
                <div className='signerPermission' key={o}>
                  <div className='signerPermissionControls'>
                    <div className='signerPermissionOrigin'>{permissions[o].origin}</div>
                    <div 
                      className={permissions[o].provider ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}
                      onClick={_ => link.send('tray:action', 'toggleAccess', this.props.account, o)}
                    >
                      <div className='signerPermissionToggleSwitch' />
                    </div>
                  </div>
                </div>
              )
            })
          )}
          {this.props.expanded ? (
            <div className='clearPermissionsButton'>
              <div onClick={() => {
                link.send('tray:action', 'clearPermissions', this.props.account)
              }} className='moduleButton'>Clear All Permissions</div>
            </div>
          ) : null}
        </div>
        {!this.props.expanded ? (
          <div className='signerBalanceTotal'>
            <div className='signerBalanceButtons'>
              <div className='signerBalanceButton signerBalanceShowAll' onClick={() => {
                const crumb = {
                  view: 'expandedModule', 
                  data: {
                    id: this.props.moduleId,
                    account: this.props.account
                  }
                }
                link.send('nav:forward', 'panel', crumb)
              }}>
                More
              </div>
            </div>
          </div>
        ) : null }
      </div>
    )
  }
}

export default Restore.connect(Balances)