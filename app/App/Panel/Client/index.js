import React from 'react'
import Restore from 'react-restore'
import link from '../../../link'

import Status from './Status'

class Client extends React.Component {
  toggle = () => {
    const client = this.props.client
    const networkId = this.store('main.connection.network')
    const on = this.store(`main.clients.${client}.on`)
    const state = this.store(`main.clients.${client}.state`)

    // Block Parity if Rinkeby selected
    if (!on && client === 'parity' && networkId === '4') return this.store.notify('rinkeby')

    // Block toggling in transient states
    if (state === 'off' || state === 'ready' || state === 'syncing') {
      link.send('tray:action', 'toggleClient', client)
    }
  }

  capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1)

  fullName = (client) => {
    if (client === 'parity') return 'Parity Ethereum'
    if (client === 'ipfs') return 'IPFS'
  }

  render () {
    const { client } = this.props
    return (
      <div className='signerPermission'>
        <div className={this.store(`main.clients.${client}.on`) ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
          <div className='connectionOptionToggle'>
            <div className='signerPermissionOrigin'>{this.fullName(client)}</div>
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

export default Restore.connect(Client)
