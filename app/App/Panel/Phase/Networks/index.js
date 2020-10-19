import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../svg'
import link from '../../../../link'

class Network extends React.Component {
  constructor (...args) {
    super(...args)
    const { id, name, type, explorer, symbol } = this.props
    this.state = { id, name, explorer, type, symbol, submitted: false }
  }

  render () {
    const changed = (
      this.props.id !== this.state.id ||
      this.props.name !== this.state.name ||
      this.props.symbol !== this.state.symbol ||
      this.props.explorer !== this.state.explorer ||
      this.props.type !== this.state.type
    )
    return (
      <div className='phaseNetworkLine'>
        {changed ? (
          <div
            className='phaseNetworkSubmit phaseNetworkSubmitEnabled' onMouseDown={() => {
              const net = { id: this.props.id, name: this.props.name, type: this.props.type, symbol: this.props.symbol, explorer: this.props.explorer }
              const newNet = { id: this.state.id, name: this.state.name, type: this.state.type, symbol: this.state.symbol, explorer: this.state.explorer }
              this.setState({ submitted: true })
              link.send('tray:action', 'updateNetwork', net, newNet)
              setTimeout(() => this.setState({ submitted: false }), 1600)
            }}
          >
            {svg.save(16)}
          </div>
        ) : (this.state.submitted ? (
            <div className='phaseNetworkSubmit phaseNetworkSubmitted'>
              {svg.octicon('check', { height: 22 })}
            </div>
          ) : (
            <div
              className='phaseNetworkSubmit phaseNetworkRemove' onMouseDown={() => {
                const { id, name, type, explorer } = this.props
                link.send('tray:action', 'removeNetwork', { id, name, explorer, type })
              }}
            >
              {svg.trash(16)}
            </div>
          )
        )}
        <div className='phaseNetworkName'>
          <input
            value={this.state.name} spellCheck='false'
            onChange={(e) => {
              this.setState({ name: e.target.value })
            }}
            onBlur={(e) => {
              if (e.target.value === '') this.setState({ name: this.props.name })
            }}
          />
        </div>
        <div className='phaseNetworkSymbol'>
          <input
            value={this.state.symbol} spellCheck='false'
            onChange={(e) => {
              if (e.target.value.length > 8) return e.preventDefault()
              this.setState({ symbol: e.target.value })
            }}
            onBlur={(e) => {
              if (e.target.value === '') this.setState({ symbol: this.props.symbol })
            }}
          />
        </div>
        <div className='phaseNetworkId'>
          <input
            value={this.state.id} spellCheck='false'
            onChange={(e) => {
              this.setState({ id: e.target.value })
            }}
            onBlur={(e) => {
              if (e.target.value === '') this.setState({ id: this.props.id })
            }}
          />
        </div>
        <div className='phaseNetworkExplorer'>
          <input
            value={this.state.explorer} spellCheck='false'
            onChange={(e) => {
              this.setState({ explorer: e.target.value })
            }}
            onBlur={(e) => {
              if (e.target.value === '') this.setState({ explorer: this.props.explorer })
            }}
          />
        </div>
      </div>
    )
  }
}

class NetworkWrap extends React.Component {
  constructor (...args) {
    super(...args)
    this.newNetworkIdDefault = 'ID'
    this.newNetworkNameDefault = 'New Network'
    this.newNetworkExplorerDefault = 'Block Explorer'
    this.newNetworkSymbolDefault = 'Ξ'
    this.newNetworkType = 'ethereum'
    this.state = {
      newNetworkId: this.newNetworkIdDefault,
      newNetworkName: this.newNetworkNameDefault,
      newNetworkExplorer: this.newNetworkExplorerDefault,
      newNetworkSymbol: this.newNetworkSymbolDefault,
      newNetworkType: this.newNetworkType
    }
  }

  renderNetworks () {
    const networks = this.store('main.networks')
    const nets = []
    Object.keys(networks).forEach(type => {
      nets.push(
        <div key={type}>
          {type === 'ethereum' ? (
            <div className='phaseHeader'>
              <div className='phaseHeaderText'>
                <div className='phaseHeaderIcon'>{svg.ethereum(20)}</div>
                {'Ethereum Networks'}
              </div>
            </div>
          ) : (
            <div className='phaseHeader'>
              {'Unknown Networks'}
            </div>
          )}
          {Object.keys(networks[type]).sort((a, b) => {
            return parseInt(a) - parseInt(b)
          }).map(id => {
            return <Network key={type + id} id={id} name={networks[type][id].name} symbol={networks[type][id].symbol} explorer={networks[type][id].explorer} type={type} />
          })}
        </div>
      )
    })
    return nets
  }

  render () {
    const changedNewNetwork = (
      this.state.newNetworkId !== this.newNetworkIdDefault ||
      this.state.newNetworkName !== this.newNetworkNameDefault ||
      this.state.newNetworkExplorer !== this.newNetworkExplorerDefault ||
      this.state.newNetworkSymbol !== this.newNetworkSymbolDefault
    )

    const newNetworkReady = (
      this.state.newNetworkId !== this.newNetworkIdDefault && this.state.newNetworkId !== '' &&
      this.state.newNetworkName !== this.newNetworkNameDefault && this.state.newNetworkName !== '' &&
      this.state.newNetworkExplorer !== this.newNetworkExplorerDefault && this.state.newNetworkExplorer !== ''
    )

    return (
      <div className='phaseMainInner'>
        <div className='phaseTitle'>Networks</div>
        <div className='phaseBreak' />
        <div className='phaseSubtitle'>Add, edit or remove networks</div>
        <div className='phaseBreak' />
        <div className='phaseNetwork'>
          {this.renderNetworks()}
          <div className='phaseBreak' style={{ margin: '13px 0px 11px 0px' }} />
          <div className='phaseNetworkLine phaseNetworkCreate'>
            {changedNewNetwork && newNetworkReady ? (
              <div
                className='phaseNetworkSubmit phaseNetworkSubmitEnabled' onMouseDown={() => {
                  const net = {
                    id: this.state.newNetworkId,
                    name: this.state.newNetworkName,
                    type: this.state.newNetworkType,
                    explorer: this.state.newNetworkExplorer,
                    symbol: this.state.newNetworkSymbol
                  }
                  link.send('tray:action', 'addNetwork', net)
                  this.setState({
                    newNetworkId: this.newNetworkIdDefault,
                    newNetworkName: this.newNetworkNameDefault,
                    newNetworkExplorer: this.newNetworkExplorerDefault,
                    newNetworkSymbol: this.newNetworkSymbolDefault
                  })
                }}
              >
                {svg.save(16)}
              </div>
            ) : (
              <div className='phaseNetworkSubmit'>
                {svg.octicon('plus', { height: 17 })}
              </div>
            )}
            <div className='phaseNetworkName'>
              <input
                value={this.state.newNetworkName} spellCheck='false'
                onChange={(e) => {
                  this.setState({ newNetworkName: e.target.value })
                }}
                onFocus={(e) => {
                  if (e.target.value === this.newNetworkNameDefault) this.setState({ newNetworkName: '' })
                }}
                onBlur={(e) => {
                  if (e.target.value === '') this.setState({ newNetworkName: this.newNetworkNameDefault })
                }}
              />
            </div>
            <div className='phaseNetworkId'>
              <input
                value={this.state.newNetworkId} spellCheck='false'
                onChange={(e) => {
                  if (Number(parseInt(e.target.value)) || e.target.value === '') {
                    this.setState({ newNetworkId: e.target.value })
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value === this.newNetworkIdDefault) this.setState({ newNetworkId: '' })
                }}
                onBlur={(e) => {
                  if (e.target.value === '') this.setState({ newNetworkId: this.newNetworkIdDefault })
                }}
              />
            </div>
            <div className='phaseNetworkSymbol'>
              <input
                value={this.state.newNetworkSymbol} spellCheck='false'
                onChange={(e) => {
                  if (e.target.value.length > 8) return e.preventDefault()
                  this.setState({ newNetworkSymbol: e.target.value })
                }}
                onFocus={(e) => {
                  if (e.target.value === this.newNetworkSymbolDefault) this.setState({ newNetworkSymbol: '' })
                }}
                onBlur={(e) => {
                  if (e.target.value === '') this.setState({ newNetworkSymbol: this.newNetworkSymbolDefault })
                }}
              />
            </div>
            <div className='phaseNetworkExplorer'>
              <input
                value={this.state.newNetworkExplorer} spellCheck='false'
                onChange={(e) => {
                  this.setState({ newNetworkExplorer: e.target.value })
                }}
                onFocus={(e) => {
                  if (e.target.value === this.newNetworkExplorerDefault) this.setState({ newNetworkExplorer: '' })
                }}
                onBlur={(e) => {
                  if (e.target.value === '') this.setState({ newNetworkExplorer: this.newNetworkExplorerDefault })
                }}
              />
            </div>
          </div>
        </div>
        <div className='phaseFooter'>{svg.logo(32)}</div>
      </div>
    )
  }
}

export default Restore.connect(NetworkWrap)
