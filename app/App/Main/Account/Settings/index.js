import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import Verify from './Verify'

class Settings extends React.Component {
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
      expand: false,
      name: ''
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
    this.nameObs = this.store.observer(() => {
      const name = this.store('main.accounts', this.props.account, 'name')
      if (name !== this.state.name) this.setState({ name })
    })
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.nameObs.remove()
  }

  render () {
    const account = this.store('main.accounts', this.props.account)
    return (
      <div ref={this.moduleRef}>
        <div className='moduleMain moduleMainSettings'>
          {!this.props.expanded ? (
            <div className='moduleButton' onMouseDown={() => this.props.expandModule({ id: this.props.moduleId, account: this.props.account })}>
              Account Settings
            </div>
          ) : (
            <>
              <div className='settingsRow'>
                <input
                  type='text'
                  tabIndex='-1'
                  value={this.state.name} 
                  onChange={(e) => {
                    this.setState({ name: e.target.value })
                    link.send('tray:renameAccount', this.props.account, e.target.value)
                  }}
                />
                <div className='settingsRowTag'>
                  {'Account Tag'}
                </div>
              </div>
              
              <div className='settingsRow'>
                <Verify 
                  id={this.props.account}
                />
              </div>

              {account.smart ? (
                <div className='settingsRow'>Chain ID: {account.smart.chain && account.smart.chain.id}</div>
              ) : null}

              <div className='settingsRow'>
                <div>{`Account using ${account.lastSignerType} signer`}</div>
                {account.signer ? (
                  <div className='settingsRowInset settingsRowInsetConnected'>{'signer connected'}</div>
                ) : (
                  <div className='settingsRowInset'>{'signer not connected'}</div>
                )}
              </div>

              <div className='moduleButton moduleButtonBad' onMouseDown={() => {
                link.rpc('removeAccount', this.props.account, {}, () => {})
              }}>
                {'Remove This Account'}
              </div>
              {/* <div className='moduleRow'>ENS Name: {account.ensName  ? account.ensName : 'none'}</div> */}
              {/* <div className='moduleRow'>Account Added: {account.created}</div> */}
            </>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Settings)