import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

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
    const i = 0
    // const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
    // const id = this.store('selected.current')
    // const address = this.store('main.accounts', this.props.id, 'address')
    const permissions = this.store('main.permissions', this.props.id) || {}
    let permissionList = Object.keys(permissions).sort((a, b) => (a.origin < b.origin ? -1 : 1))
    if (!this.props.expanded) permissionList = permissionList.slice(0, 3)

    return (
      <div
        ref={this.moduleRef}
        style={
          this.props.expanded
            ? {
                height: '100%',
                overflowY: 'scroll',
              }
            : {}
        }
      >
        <div className='moduleHeader'>
          {'Permissions'}
          {this.props.expanded ? (
            <div className='moduleHeaderClose' onClick={() => this.props.expandModule(false)}>
              {svg.close(12)}
            </div>
          ) : null}
        </div>

        <div className='moduleMain moduleMainPermissions'>
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
                      onClick={(_) => link.send('tray:action', 'toggleAccess', this.props.id, o)}
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
              <div
                onClick={() => {
                  link.send('tray:action', 'clearPermissions', this.props.id)
                }}
                className='moduleButton'
              >
                Clear All Permissions
              </div>
            </div>
          ) : null}
        </div>
        {!this.props.expanded ? (
          <div className='signerBalanceTotal'>
            <div className='signerBalanceButtons'>
              <div
                className='signerBalanceButton signerBalanceShowAll'
                onClick={() => this.props.expandModule(this.props.moduleId)}
              >
                More
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Balances)
