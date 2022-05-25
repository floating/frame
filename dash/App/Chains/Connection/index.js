import React, { createRef } from 'react'
import Restore from 'react-restore'

import Dropdown from '../../../../resources/Components/Dropdown'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

const Indicator = ({ status }) => {
  const statusMap = {
    connected: 'Good',
    loading: 'Pending',
    syncing: 'Pending',
    pending: 'Pending',
    standby: 'Pending'
  }

  return <div className={`sliceTileIndicatorLarge sliceTileIndicator${statusMap[status] || 'Bad'}`} />
}

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

  renderConnection (id, connection, blockHeight) {
    let currentConnectionName = ''
    let currentConnectionStatus = ''
    if (connection.primary.on) {
      currentConnectionName = connection.primary.connected ? connection.primary.current : connection.primary.status
      currentConnectionStatus = connection.primary.status 
    } else if (connection.secondary.on) {
      currentConnectionName = connection.secondary.connected ? connection.secondary.current : connection.secondary.status
      currentConnectionStatus = connection.secondary.status 
    }

    return (
      <div 
        className='sliceTile sliceTileClickable'
        onClick={() => {
          this.setState({ expanded: !this.state.expanded })
        }}
      >
        <Indicator className='sliceTileIndicatorLarge' status={currentConnectionStatus} />
        <div className='sliceTileConnectionName'> 
          {currentConnectionName}
        </div>
        <div className='sliceTileBlock'>
          <div className='sliceTileBlockIcon'>{svg.chain(14)}</div>
          <div className='sliceTileChainId'>{id}</div>
          <div className='sliceTileBlockIcon'>{svg.cube(14)}</div>
          <div>{blockHeight}</div>
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

    const networkMeta = this.store('main.networksMeta.ethereum', id)
    const networkPresets = this.store('main.networkPresets', type)
    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: `${type}:${id}:${i}` }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: `${type}:${id}:${i}` })))
    presets.push({ text: 'Custom', value: `${type}:${id}:custom` })

    return (
      <div className='sliceContainer' ref={this.ref}>
        {this.renderConnection(id, connection, networkMeta.blockHeight)}
        {this.state.expanded ? (
          <div className='connectionLevels'>
            <div className='signerPermission signerPermissionNetwork cardShow' style={{ zIndex: 2 }}>
              <div className={connection.primary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
                <div className='connectionOptionToggle'>
                  <div className='signerPermissionSetting'>Primary</div>
                  <div className={connection.primary.on ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn' : 'signerPermissionToggleSmall'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'primary')}>
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
                {connection.primary.on ? (
                  <>
                    <div className='connectionOptionDetails cardShow'>
                      <div className='connectionOptionDetailsInset'>
                        {this.status(type, id, 'primary')}
                        <Dropdown
                          syncValue={`${type}:${id}:${connection.primary.current}`}
                          onChange={preset => {
                            const [type, id, value] = preset.split(':')
                            link.send('tray:action', 'selectPrimary', type, id, value)
                          }}
                          options={presets}
                        />
                      </div>
                    </div>
                    <div className={connection.primary.current === 'custom' && connection.primary.on ? 'connectionCustomInput connectionCustomInputOn cardShow' : 'connectionCustomInput'}>
                      <input 
                        className='customInput'
                        tabIndex='-1'
                        value={this.state.primaryCustom}
                        onFocus={() => this.customPrimaryFocus()} 
                        onBlur={() => this.customPrimaryBlur()}
                        onChange={e => this.inputPrimaryCustom(e)}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className='signerPermission signerPermissionNetwork cardShow' style={{ zIndex: 1 }}>
              <div className={connection.secondary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}>
                <div className='connectionOptionToggle'>
                  <div className='signerPermissionSetting'>Secondary</div>
                  <div className={connection.secondary.on ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn' : 'signerPermissionToggleSmall'} onMouseDown={_ => link.send('tray:action', 'toggleConnection', type, id, 'secondary')}>
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
                {connection.secondary.on ? (
                  <>
                    <div className='connectionOptionDetails cardShow'>
                      <div className='connectionOptionDetailsInset'>
                        {this.status(type, id, 'secondary')}
                        <Dropdown
                          syncValue={`${type}:${id}:${connection.secondary.current}`}
                          onChange={preset => {
                            const [type, id, value] = preset.split(':')
                            link.send('tray:action', 'selectSecondary', type, id, value)
                          }}
                          options={presets}
                        />
                      </div>
                    </div>
                    <div className={connection.secondary.current === 'custom' && connection.secondary.on ? 'connectionCustomInput connectionCustomInputOn cardShow' : 'connectionCustomInput'}>
                      <input tabIndex='-1' value={this.state.secondaryCustom} onFocus={() => this.customSecondaryFocus()} onBlur={() => this.customSecondaryBlur()} onChange={e => this.inputSecondaryCustom(e)} />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>   
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(ChainModule)
