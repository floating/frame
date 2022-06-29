import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../resources/svg'
import link from '../../../../../resources/link'

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
      newNetworkId: parseInt(this.chain.id, 'hex') || this.newNetworkIdDefault,
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

  render () {
    const changedNewNetwork = (
      this.state.newNetworkId !== this.newNetworkIdDefault ||
      this.state.newNetworkName !== this.newNetworkNameDefault ||
      this.state.newNetworkExplorer !== this.newNetworkExplorerDefault ||
      this.state.newNetworkSymbol !== this.newNetworkSymbolDefault ||
      this.state.newNetworkRPCPrimary !== this.newNetworkRPCPrimary ||
      this.state.newNetworkRPCSecondary !== this.newNetworkRPCSecondary
    )

    const newNetworkReady = (
      this.state.newNetworkId !== this.newNetworkIdDefault && this.state.newNetworkId !== '' &&
      this.state.newNetworkName !== this.newNetworkNameDefault && this.state.newNetworkName !== '' &&
    )

    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='addChainTitle'>
            Add New Chain
          </div>
          <div className='addChain'>
            <div className='chainRow'>
              <div className='chainName'>
                <div className='chainInputLabel'>Chain Name</div>
                <input
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
              <div className='chainId'>
                <div className='chainInputLabel'>Chain ID</div>
                <input
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
                />
              </div>

              <div className='chainSymbol'>
                <div className='chainInputLabel'>Native Symbol</div>
                <input
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
              <div className='chainExplorer'>
                <div className='chainInputLabel'>Block Explorer</div>
                <input
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
              <div className='chainExplorer'>
                <div className='chainInputLabel'>Primary RPC</div>
                <input
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
              <div className='chainExplorer'>
                <div className='chainInputLabel'>Secondary RPC</div>
                <input
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

            {/* <div className='chainRow'>
              <div className='chainRpc'>
                <div className='chainInputLabel'>Primary Endpoint</div>
                <input
                  className='chainInput'
                  value={this.state.newNetworkRPCPrimary}
                  spellCheck='false'
                  onChange={(e) => {
                    this.setState({ newNetworkRPCPrimary: e.target.value })
                  }}
                  onFocus={(e) => {
                    if (e.target.value === this.newNetworkRPCDefault) this.setState({ newNetworkRPCPrimary: '' })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ newNetworkRPCPrimary: this.newNetworkRPCDefault })
                  }}
                />
              </div>
            </div>

            <div className='chainRow'>
              <div className='chainRpc'>
                <div className='chainInputLabel'>Secondary Endpoint</div>
                <input
                  className='chainInput'
                  value={this.state.newNetworkRPCSecondary}
                  spellCheck='false'
                  onChange={(e) => {
                    this.setState({ newNetworkRPCSecondary: e.target.value })
                  }}
                  onFocus={(e) => {
                    if (e.target.value === this.newNetworkRPCDefault) this.setState({ newNetworkRPCSecondary: '' })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ newNetworkRPCSecondary: this.newNetworkRPCDefault })
                  }}
                />
              </div>
            </div> */}

            <div className='chainRow'>
              <div className='chainLayers'>
                <div className='chainInputLabel'>Chain Type</div>
                <div className='chainLayerOptions'>
                  <div 
                    className={this.state.newNetworkLayer === 'rollup' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'rollup' })}
                  >Rollup</div>
                  <div 
                    className={this.state.newNetworkLayer === 'sidechain' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'sidechain' })}
                  >Sidechain</div>
                  <div 
                    className={this.state.newNetworkLayer === 'testnet' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'testnet' })}
                  >Testnet</div>
                  <div 
                    className={this.state.newNetworkLayer === 'other' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                    onMouseDown={() => this.setState({ newNetworkLayer: 'other' })}
                  >Other</div>
                </div>
              </div>
            </div>

            <div className='chainRow'>
              {changedNewNetwork && newNetworkReady ? (
                <div 
                  className='addTokenSubmit addTokenSubmitEnabled' 
                  onMouseDown={() => {
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
                    link.send('tray:addChain', net, this.props.req)
                    setTimeout(() => {
                      this.store.notify()
                    }, 400)
                  }}
                >
                  Add Chain
                </div>
              ) : (
                <div 
                  className='addTokenSubmit' 
                >
                  Fill in Chain
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddChain)
