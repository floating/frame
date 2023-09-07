import React, { createRef } from 'react'
import Restore from 'react-restore'

import Dropdown from '../../../../../../resources/Components/Dropdown'
import { ClusterRow, ClusterValue } from '../../../../../../resources/Components/Cluster'
import { isInvalidCustomTarget } from '../../../../../../resources/connections'
import { capitalize } from '../../../../../../resources/utils'

import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'
import { NETWORK_PRESETS } from '../../../../../../resources/constants'

function mapToPreset(chainId, key) {
  return { text: key, value: `ethereum:${chainId}:${key}` }
}

const ConnectionIndicator = ({ className, connection }) => {
  const isConnected = connection.status === 'connected'
  const isLoading = connection.status === 'loading'
  const isPending = connection.status === 'pending'
  const isSyncing = connection.status === 'syncing'
  const isStandBy = connection.status === 'standby'
  const isDegraded = connection.status === 'degraded'

  let status = 'Bad'

  if (isConnected) {
    status = 'Good'
  } else if (isDegraded) {
    status = 'Warning'
  } else if (isLoading || isPending || isSyncing || isStandBy) {
    status = 'Pending'
  }

  return <div className={`${className}${status}`} />
}

const ConnectionStatus = ({ connection }) => (
  <div style={{ display: 'flex' }}>
    <ConnectionIndicator className='sliceTileIndicatorLarge sliceTileIndicator' connection={connection} />
    <div className='sliceTileConnectionName'>{connection.current}</div>
  </div>
)

function getActiveConnection(primary, secondary) {
  if (secondary.on && (!primary.on || primary.status === 'disconnected')) {
    return secondary
  }

  return primary
}

class ChainModule extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.customMessage = 'Custom Endpoint'

    const { id, type } = props
    const primaryCustom =
      context.store('main.networks', type, id, 'connection.primary.custom') || this.customMessage
    const secondaryCustom =
      context.store('main.networks', type, id, 'connection.secondary.custom') || this.customMessage

    this.state = {
      expanded: props.expanded || false,
      primaryCustom,
      secondaryCustom
    }

    this.ref = createRef()
  }

  renderConnection(id, { primary, secondary }, blockHeight) {
    const connection = getActiveConnection(primary, secondary)

    return (
      <ClusterRow>
        <ClusterValue
          onClick={() => {
            this.setState({ expanded: !this.state.expanded })
          }}
        >
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <ConnectionStatus connection={connection} />
            <div className='sliceTileBlock'>
              <div className='sliceTileBlockIcon'>{svg.chain(14)}</div>
              <div className='sliceTileChainId'>{id}</div>
              <div className='sliceTileBlockIcon'>{svg.cube(14)}</div>
              <div>{blockHeight}</div>
            </div>
          </div>
        </ClusterValue>
      </ClusterRow>
    )
  }

  status(type, id, layer) {
    const { status, network, current } = this.store('main.networks', type, id, 'connection', layer)

    if (status === 'connected' && !network) return 'loading'
    if (!this.store('main.networks', type, id, 'on')) return 'off'

    if (current === 'custom') {
      const customTarget = this.state[`${layer}Custom`]
      if (customTarget !== '' && customTarget !== this.customMessage) {
        const validationError = isInvalidCustomTarget(customTarget)
        if (validationError) return validationError
      }
    }

    return status
  }

  renderConnectionStatus(type, id, layer) {
    const status = this.status(type, id, layer)

    return (
      <div className='connectionOptionStatus'>
        <div className='connectionOptionStatusIndicator'>
          <ConnectionIndicator className='connectionOptionStatusIndicator' connection={{ status }} />
        </div>
        <div className='connectionOptionStatusText'>{status}</div>
      </div>
    )
  }

  render() {
    const { id, type } = this.props
    const toPreset = (key) => mapToPreset(id, key)

    const connection = this.store('main.networks', type, id, 'connection')
    if (!connection) return null

    const networkMeta = this.store('main.networksMeta.ethereum', id)
    const renderStatus = this.renderConnectionStatus.bind(this, type, id)

    const networkPresets = NETWORK_PRESETS.ethereum[id] || {}
    const defaultPresets = NETWORK_PRESETS.ethereum.default

    const presets = [
      ...Object.keys(networkPresets).map(toPreset),
      ...Object.keys(defaultPresets).map(toPreset),
      toPreset('custom')
    ]

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
      if (!value || !isInvalidCustomTarget(value)) {
        const actionName = `set${capitalize(inputName)}Custom`
        this[timeoutName] = setTimeout(
          () => link.send('tray:action', actionName, type, id, value === this.customMessage ? '' : value),
          1000
        )
      }
    }

    return (
      <>
        {this.renderConnection(id, connection, networkMeta.blockHeight)}
        {this.state.expanded && (
          <div className='connectionLevels'>
            <div className='connectionLevel' style={{ zIndex: 2 }}>
              <div
                className={connection.primary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'}
              >
                <div className='connectionOptionToggle'>
                  <div className='signerPermissionSetting'>Primary</div>
                  <div
                    className={
                      connection.primary.on
                        ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn'
                        : 'signerPermissionToggleSmall'
                    }
                    onMouseDown={(_) => link.send('tray:action', 'toggleConnection', type, id, 'primary')}
                  >
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
                {connection.primary.on ? (
                  <>
                    <div className='connectionOptionDetails'>
                      <div className='connectionOptionDetailsInset'>
                        {renderStatus('primary')}
                        <Dropdown
                          syncValue={`${type}:${id}:${connection.primary.current}`}
                          onChange={(preset) => {
                            const [type, id, value] = preset.split(':')
                            link.send('tray:action', 'selectPrimary', type, id, value)
                          }}
                          options={presets}
                        />
                      </div>
                    </div>
                    <div
                      className={
                        connection.primary.current === 'custom' && connection.primary.on
                          ? 'connectionCustomInput connectionCustomInputOn cardShow'
                          : 'connectionCustomInput'
                      }
                    >
                      <input
                        className='customInput'
                        tabIndex='-1'
                        value={this.state.primaryCustom}
                        onFocus={() => customFocusHandler('primary')}
                        onBlur={() => customBlurHandler('primary')}
                        onChange={(e) => customChangeHandler(e, 'primary')}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className='connectionLevel' style={{ zIndex: 1 }}>
              <div
                className={
                  connection.secondary.on ? 'connectionOption connectionOptionOn' : 'connectionOption'
                }
              >
                <div className='connectionOptionToggle'>
                  <div className='signerPermissionSetting'>Secondary</div>
                  <div
                    className={
                      connection.secondary.on
                        ? 'signerPermissionToggleSmall signerPermissionToggleSmallOn'
                        : 'signerPermissionToggleSmall'
                    }
                    onMouseDown={(_) => link.send('tray:action', 'toggleConnection', type, id, 'secondary')}
                  >
                    <div className='signerPermissionToggleSwitch' />
                  </div>
                </div>
                {connection.secondary.on ? (
                  <>
                    <div className='connectionOptionDetails'>
                      <div className='connectionOptionDetailsInset'>
                        {renderStatus('secondary')}
                        <Dropdown
                          syncValue={`${type}:${id}:${connection.secondary.current}`}
                          onChange={(preset) => {
                            const [type, id, value] = preset.split(':')
                            link.send('tray:action', 'selectSecondary', type, id, value)
                          }}
                          options={presets}
                        />
                      </div>
                    </div>
                    <div
                      className={
                        connection.secondary.current === 'custom' && connection.secondary.on
                          ? 'connectionCustomInput connectionCustomInputOn cardShow'
                          : 'connectionCustomInput'
                      }
                    >
                      <input
                        tabIndex='-1'
                        value={this.state.secondaryCustom}
                        onFocus={() => customFocusHandler('secondary')}
                        onBlur={() => customBlurHandler('secondary')}
                        onChange={(e) => customChangeHandler(e, 'secondary')}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
}

export default Restore.connect(ChainModule)
