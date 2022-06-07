import React, { createRef } from 'react'
import Restore from 'react-restore'

import Dropdown from '../../../../resources/Components/Dropdown'
import { okProtocol } from '../../../../resources/connections'
import { capitalize } from '../../../../resources/utils'

import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

function okPort (location) {
  const match = location.match(/^(?:https?|wss?).*:(?<port>\d{4,})/)

  if (match) {
    const portStr = (match.groups || { port: 0 }).port
    const port = parseInt(portStr)
    return port >= 0 && port <= 65535
  }

  return true
}

const ConnectionIndicator = ({ connection }) => {
  const isConnected = connection.status === 'connected'
  const isLoading = connection.status === 'loading'
  const isPending = connection.status === 'pending'
  const isSyncing = connection.status === 'syncing'
  let status = 'Bad'
  if (isConnected) {
    status = 'Good'
  } else if (isLoading || isPending || isSyncing) {
    status = 'Pending'
  }

  return <div className={`sliceTileIndicatorLarge sliceTileIndicator${status}`} />
}

const ConnectionStatus = ({ connection }) => 
  <>
    <ConnectionIndicator connection={connection} />
    <div className="sliceTileConnectionName"> 
      {connection.current}
    </div>
  </>


class ChainModule extends React.Component {
  constructor (props, context) {
    super(props, context)
    const { id, type } = props
    this.customMessage = 'Custom Endpoint'
    const primaryCustom = context.store('main.networks', type, id, 'connection.primary.custom') || this.customMessage
    const secondaryCustom = context.store('main.networks', type, id, 'connection.secondary.custom') || this.customMessage
    this.state = {
      expanded: false,      
      primaryCustom, 
      secondaryCustom, 
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

  renderConnection (id, { primary, secondary }, blockHeight) {
    const primaryActive = primary.on && primary.status !== 'disconnected'
    const secondaryActive = secondary.on && secondary.status !== 'disconnected'
    let connection = primary
    if (secondaryActive && !primaryActive) {
      connection = secondary
    }

    return (
      <div 
        className='sliceTile sliceTileClickable'
        onClick={() => {
          this.setState({ expanded: !this.state.expanded })
        }}
      >
        <ConnectionStatus connection={connection} />
        <div className='sliceTileBlock'>
          <div className='sliceTileBlockIcon'>{svg.chain(14)}</div>
          <div className='sliceTileChainId'>{id}</div>
          <div className='sliceTileBlockIcon'>{svg.cube(14)}</div>
          <div>{blockHeight}</div>
        </div>
      </div>
    )
  }

  // returns a (truthy) error message if invalid, otherwise will return false
  isInvalidCustomTarget (target) {
    if (!okProtocol(target)) return 'invalid target'
    if (!okPort(target)) return 'invalid port'

    return false
  }

  status (type, id, layer) {
    const { status, network, current } = this.store('main.networks', type, id, 'connection', layer)

    if (status === 'connected' && !network) return 'loading'
    if (!this.store('main.networks', type, id, 'on')) return 'off'

    if (current === 'custom') {
      const customTarget = this.state[`${layer}Custom`]
      if (customTarget !== '' && customTarget !== this.customMessage) {
        const validationError = this.isInvalidCustomTarget(customTarget)
        if (validationError) return validationError
      }
    }

    return status
  }

  renderConnectionStatus (type, id, layer) {
    const status = this.status(type, id, layer)

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
    const { id, type, connection } = this.props

    const networkMeta = this.store('main.networksMeta.ethereum', id)
    const networkPresets = this.store('main.networkPresets', type)
    const renderStatus = this.renderConnectionStatus.bind(this, type, id)

    let presets = networkPresets[id] || {}
    presets = Object.keys(presets).map(i => ({ text: i, value: `${type}:${id}:${i}` }))
    presets = presets.concat(Object.keys(networkPresets.default).map(i => ({ text: i, value: `${type}:${id}:${i}` })))
    presets.push({ text: 'Custom', value: `${type}:${id}:custom` })

    const customFocusHandler = (inputName) => {
      const stateKey = `${inputName}Custom`
      const state = this.state[stateKey]
      if (state === this.customMessage) {
        this.setState({ [stateKey]: '' })
      }
    }

    const customBlurHandler = (inputName) => {
      const stateKey = `${inputName}Custom`
      const state = this.state[stateKey]
      if (state === '') {
        this.setState({ [stateKey]: this.customMessage })
      }
    }

    const customChangeHandler = (e, inputName) => {
      e.preventDefault()

      const stateKey = `${inputName}Custom`
      const timeoutName = `${stateKey}InputTimeout`
      const value = e.target.value.replace(/\s+/g, '')

      clearTimeout(this[timeoutName])
      this.setState({ [stateKey]: value })

      // allow falsy values to pass through to the application state so the connection
      // status can be updated
      if (!value || !this.isInvalidCustomTarget(value)) {
        const actionName = `set${capitalize(inputName)}Custom`
        this[timeoutName] = setTimeout(() => link.send('tray:action', actionName, type, id, value === this.customMessage ? '' : value), 1000)
      }
    }

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
                        {renderStatus('primary')}
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
                        onFocus={() => customFocusHandler('primary')} 
                        onBlur={() => customBlurHandler('primary')}
                        onChange={e => customChangeHandler(e, 'primary')}
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
                        {renderStatus('secondary')}
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
                      <input 
                        tabIndex='-1' 
                        value={this.state.secondaryCustom} 
                        onFocus={() => customFocusHandler('secondary')} 
                        onBlur={() => customBlurHandler('secondary')} 
                        onChange={e => customChangeHandler(e, 'secondary')} 
                      />
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
