import React, { createRef } from 'react'
import Restore from 'react-restore'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

class ChainModule extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expanded: false
    }
    this.ref = createRef()
  }

  // clickHandler (e) {
  //   if (!e.composedPath().includes(this.ref.current)) {
  //     if (this.state.expanded) this.setState({ expanded: false })
  //   }
  // }

  // componentDidMount () {
  //   document.addEventListener('click', this.clickHandler.bind(this))
  // }

  // componentDidUnmount () {
  //   document.removeEventListener('click', this.clickHandler.bind(this))
  // }

  renderConnection (origin, id) {
    return (
      <div 
        className='sliceTile sliceTileClickable'
        onClick={() => {
          link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'customTokens', notifyData: {} }})
        }}
      >
        <div className='sliceTileTokens'>
          <div>{'Manage Tokens'}</div>
        </div>
        
      </div>
    )
  }
  status (type, id, layer) {
    const connection = this.store('main.networks', type, id, 'connection', layer)
    let status = connection.status
    const current = connection.current

    if (current === 'custom') {
      if (layer === 'primary' && this.state.primaryCustom !== '' && this.state.primaryCustom !== this.customMessage) {
        if (!this.okProtocol(this.state.primaryCustom)) status = 'invalid target'
        else if (!this.okPort(this.state.primaryCustom)) status = 'invalid port'
      }

      if (layer === 'secondary' && this.state.secondaryCustom !== '' && this.state.secondaryCustom !== this.customMessage) {
        if (!this.okProtocol(this.state.secondaryCustom)) status = 'invalid target'
        else if (!this.okPort(this.state.secondaryCustom)) status = 'invalid port'
      }
    }
    if (status === 'connected' && !connection.network) status = 'loading'
    if (!this.store('main.networks', type, id, 'on')) status = 'off'

    return (
      <div className='connectionOptionStatus'>
        {this.indicator(status)}
        <div className='connectionOptionStatusText'>{status}</div>
      </div>
    )
  }
  indicator (status) {
    if (status === 'connected') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorGood' /></div>
    } else if (status === 'loading' || status === 'syncing' || status === 'pending' || status === 'standby') {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorPending' /></div>
    } else {
      return <div className='connectionOptionStatusIndicator'><div className='connectionOptionStatusIndicatorBad' /></div>
    }
  }
  render () {
    const { id, type, connection, changed } = this.props

    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: type + ':' + id + ':' + i }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: type + ':' + id + ':' + i })))
    presets.push({ text: 'Custom', value: type + ':' + id + ':' + 'custom' })

    return (
      <div className='sliceContainer' ref={this.ref}>
        {this.renderConnection('connection', id)}
        {this.state.expanded ? (
          <div>{'HELLO'}</div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(ChainModule)
