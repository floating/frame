import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'

import Status from './Status'

class EthereumClient extends React.Component {

  toggle = () => {
    const client = this.props.client
    const networkId = this.store('main.connection.network')
    const { on, state } = this.store(`main.clients.${client}`)

    // Block toggling of Parity if Rinkeby selected and notify user
    if (!on && client === 'parity' && networkId === '4') return this.store.notify('rinkeby')

    // Block toggling in transient states
    if (state === 'off' || state === 'ready' || state === 'syncing') {
      link.send('tray:action', 'toggleClient', client)
    }
  }

  capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1)

  render () {
    const { client } = this.props
    return (
      <div className='signerPermission'>
        <div className={this.store(`main.clients.${client}.on`) ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
          <div className='connectionOptionToggle'>
            <div className='signerPermissionOrigin'>{this.capitalize(client)}</div>
            <div
              className={this.store(`main.clients.${client}.on`) ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}
              onMouseDown={_ => this.toggle()}>
              <div className='signerPermissionToggleSwitch' />
            </div>
          </div>
          <div className='connectionOptionDetails'>
            <div className='connectionOptionDetailsInset'>
              <Status client={this.store(`main.clients.${client}`)} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(EthereumClient)
