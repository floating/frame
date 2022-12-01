import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

class Balances extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
            height: this.moduleRef.current.clientHeight,
          })
        }
      })
    }
  }

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  render() {
    const permissions = this.store('main.permissions', this.props.account) || {}
    let permissionList = Object.keys(permissions).sort((a, b) => (a.origin < b.origin ? -1 : 1))
    if (!this.props.expanded) permissionList = permissionList.slice(0, 3)

    return (
      <div className='accountViewScroll'>
        <div className='moduleMainPermissions'>
          {permissionList.length === 0 ? (
            <div className='signerPermission'>
              <div className='signerPermissionControls'>
                <div className='signerPermissionNoPermissions'>No Permissions Set</div>
              </div>
            </div>
          ) : (
            permissionList.map((o) => {
              return (
                <div className='signerPermission' key={o}>
                  <div className='signerPermissionControls'>
                    <div className='signerPermissionOrigin'>{permissions[o].origin}</div>
                    <div
                      className={
                        permissions[o].provider
                          ? 'signerPermissionToggle signerPermissionToggleOn'
                          : 'signerPermissionToggle'
                      }
                      onClick={(_) => link.send('tray:action', 'toggleAccess', this.props.account, o)}
                    >
                      <div className='signerPermissionToggleSwitch' />
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div className='clearPermissionsButton'>
            <div
              onClick={() => {
                link.send('tray:action', 'clearPermissions', this.props.account)
              }}
              className='moduleButton'
            >
              Clear All Permissions
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)
