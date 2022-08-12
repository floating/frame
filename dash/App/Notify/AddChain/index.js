import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'
import { SubmitButton, DisabledSubmitButton } from '../Button'

class AddChain extends React.Component {
  constructor (props, context) {
    super(props, context)

    this.newNetworkIdDefault = 'Chain ID'
    this.newNetworkNameDefault = 'Chain Name'
    this.newNetworkExplorerDefault = 'Block Explorer'
    this.newNetworkRPCPrimary = 'Primary Endpoint'
    this.newNetworkRPCSecondary = 'Secondary Endpoint'
    this.newNetworkSymbolDefault = 'Native Symbol'
    this.newNetworkType = 'ethereum'
    this.newNetworkLayer = ''
    this.req = props.req
    this.chain = (this.req && this.req.chain) || {}

    const blockExplorerUrls = this.chain.blockExplorerUrls || []
    const rpcUrls = this.chain.rpcUrls || []
    const nativeChainCurrency = this.chain.nativeCurrency || {}

    this.state = {
      newNetworkId: parseInt(this.chain.id) || this.newNetworkIdDefault,
      newNetworkName: this.chain.name || this.newNetworkNameDefault,
      newNetworkExplorer: blockExplorerUrls[0] || this.newNetworkExplorerDefault,
      newNetworkRPCPrimary: rpcUrls[0] || this.newNetworkRPCPrimary,
      newNetworkRPCSecondary: rpcUrls[1] || this.newNetworkRPCSecondary,
      newNetworkSymbol: nativeChainCurrency.symbol || this.newNetworkSymbolDefault,
      newNetworkType: this.chain.type || this.newNetworkType,
      newNetworkLayer: this.chain.layer || 'other',
      localShake: {}, 
      resetConfirm: false, 
      expandNetwork: false 
    }
  }

  isValidChain (chainId) {
    const existingChains = Object.keys(this.store('main.networks.ethereum')).map(id => parseInt(id))
    return !existingChains.includes(parseInt(chainId))
  }

  networkChanged () {
    return (
      this.state.newNetworkId !== this.newNetworkIdDefault ||
      this.state.newNetworkName !== this.newNetworkNameDefault ||
      this.state.newNetworkExplorer !== this.newNetworkExplorerDefault ||
      this.state.newNetworkSymbol !== this.newNetworkSymbolDefault ||
      this.state.newNetworkRPCPrimary !== this.newNetworkRPCPrimary ||
      this.state.newNetworkRPCSecondary !== this.newNetworkRPCSecondary
    )
  }

  networkReady () {
    return (
      this.state.newNetworkId !== this.newNetworkIdDefault && this.state.newNetworkId !== '' &&
      this.state.newNetworkName !== this.newNetworkNameDefault && this.state.newNetworkName !== ''
    )
  }

  disabledSubmitButton (text) {
    return (
      <div role='button' className='addTokenSubmit'>{text}</div>
    )
  }

  chainIdInput () {
    if (this.props.editMode) {
      return (<div className='chainFieldDisplay'>{this.state.newNetworkId}</div>)
    }

    return (<input
      id='chainId'
      className={this.state.newNetworkId === this.newNetworkIdDefault ? 'chainInput chainInputDim' : 'chainInput'}
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
    />)
  }

  submitButton () {
    if (!this.networkChanged() || !this.networkReady()) {
      return <DisabledSubmitButton text={'Fill in Chain'} />
    }

    if (!this.props.editMode && !this.isValidChain(parseInt(this.state.newNetworkId))) {
      return <DisabledSubmitButton text={'Chain ID already exists'} />
    }

    const onClick = () => {
      const net = {
        id: this.state.newNetworkId,
        name: this.state.newNetworkName,
        type: this.state.newNetworkType,
        explorer: this.state.newNetworkExplorer,
        symbol: this.state.newNetworkSymbol,
        layer: this.state.newNetworkLayer,
        primaryRpc: this.state.newNetworkRPCPrimary,
        secondaryRpc: this.state.newNetworkRPCSecondary,
      }

      if (!this.props.editMode) {
        link.send('tray:addChain', net, this.props.req)
      } else {
        const currentNet = {
          id: this.chain.id,
          name: this.chain.name,
          type: this.chain.type,
          explorer: this.chain.blockExplorerUrls[0],
          symbol: this.chain.nativeCurrency.symbol,
          layer: this.chain.layer,
          primaryRpc: this.state.newNetworkRPCPrimary,
          secondaryRpc: this.state.newNetworkRPCSecondary,
        }

        link.send('tray:action', 'updateNetwork', currentNet, net)
      }
    }
    
    return (
      <SubmitButton handleClick={onClick} text={this.props.editMode ? 'Update Chain' : 'Add Chain'} />
    )
  }

  render () {
    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='addChainTitle'>
            {this.props.editMode ? 'Chain Config' : 'Add New Chain'}
          </div>
          <div className='addChain'>
            <div className='chainRow'>
              <div className='chainName chainInputField'>
                <label htmlFor='chainName' className='chainInputLabel'>Chain Name</label>
                <input
                  id='chainName'
                  className={this.state.newNetworkName === this.newNetworkNameDefault ? 'chainInput chainInputDim' : 'chainInput'}
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
            </div>

            <div className='chainRow'>
              <div className='chainId chainInputField'>
                <label htmlFor='chainId' className='chainInputLabel'>Chain ID</label>
                {this.chainIdInput()}
              </div>

              <div className='chainSymbol chainInputField'>
                <label htmlFor='chainSymbol' className='chainInputLabel'>Native Symbol</label>
                <input
                  id='chainSymbol'
                  className={this.state.newNetworkSymbol === this.newNetworkSymbolDefault ? 'chainInput chainInputDim' : 'chainInput'}
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
            </div>

            <div className='chainRow'>
              <div className='chainExplorer chainInputField'>
                <label htmlFor='chainExplorer' className='chainInputLabel'>Block Explorer</label>
                <input
                  id='chainExplorer'
                  className={this.state.newNetworkExplorer === this.newNetworkExplorerDefault ? 'chainInput chainInputDim' : 'chainInput'}
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

            <div className='chainRow'>
              <div className='chainExplorer chainInputField'>
                <label htmlFor='primaryRpc' className='chainInputLabel'>Primary RPC</label>
                <input
                  id='primaryRpc'
                  className={this.state.newNetworkRPCPrimary === this.newNetworkRPCPrimary ? 'chainInput chainInputDim' : 'chainInput'}
                  value={this.state.newNetworkRPCPrimary} spellCheck='false'
                  onChange={(e) => {
                    this.setState({ newNetworkRPCPrimary: e.target.value })
                  }}
                  onFocus={(e) => {
                    if (e.target.value === this.newNetworkRPCPrimary) this.setState({ newNetworkRPCPrimary: '' })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ newNetworkRPCPrimary: this.newNetworkRPCPrimary })
                  }}
                />
              </div>
            </div>

            <div className='chainRow'>
              <div className='chainExplorer chainInputField'>
                <label htmlFor='secondaryRpc' className='chainInputLabel'>Secondary RPC</label>
                <input
                  id='secondaryRpc'
                  className={this.state.newNetworkRPCSecondary === this.newNetworkRPCSecondary ? 'chainInput chainInputDim' : 'chainInput'}
                  value={this.state.newNetworkRPCSecondary} spellCheck='false'
                  onChange={(e) => {
                    this.setState({ newNetworkRPCSecondary: e.target.value })
                  }}
                  onFocus={(e) => {
                    if (e.target.value === this.newNetworkRPCSecondary) this.setState({ newNetworkRPCSecondary: '' })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ newNetworkRPCSecondary: this.newNetworkRPCSecondary})
                  }}
                />
              </div>
            </div>

            <div className='chainRow'>
              <div className='chainLayers chainInputField'>
                <div role='label' className='chainInputLabel'>Chain Type</div>
                <div role='radiogroup' className='chainLayerOptions'>
                  <div
                    role='radio'
                    aria-checked={this.state.newNetworkLayer === 'rollup'}
                    className={this.state.newNetworkLayer === 'rollup' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'rollup' })}
                  >Rollup</div>
                  <div
                    role='radio'
                    aria-checked={this.state.newNetworkLayer === 'sidechain'}
                    className={this.state.newNetworkLayer === 'sidechain' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'sidechain' })}
                  >Sidechain</div>
                  <div
                    role='radio'
                    aria-checked={this.state.newNetworkLayer === 'testnet'}
                    className={this.state.newNetworkLayer === 'testnet' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'testnet' })}
                  >Testnet</div>
                  <div
                    role='radio'
                    aria-checked={this.state.newNetworkLayer === 'other'}
                    className={this.state.newNetworkLayer === 'other' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'other' })}
                  >Other</div>
                </div>
              </div>
            </div>

            <div className='chainRow'>
              {this.submitButton()}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddChain)
