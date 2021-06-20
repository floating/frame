import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../resources/svg'
import link from '../../../../../resources/link'

class AddChain extends React.Component {
  constructor (...args) {
    super(...args)
    this.newNetworkIdDefault = 'ID'
    this.newNetworkNameDefault = 'Chain Name'
    this.newNetworkExplorerDefault = 'Block Explorer'
    this.newNetworkRPCDefault = 'RPC Endpoint'
    this.newNetworkSymbolDefault = 'ETH'
    this.newNetworkType = 'ethereum'
    this.newNetworkLayer = ''
    this.state = {
      newNetworkId: this.newNetworkIdDefault,
      newNetworkName: this.newNetworkNameDefault,
      newNetworkExplorer: this.newNetworkExplorerDefault,
      newNetworkRPCPrimary: this.newNetworkRPCDefault,
      newNetworkRPCSecondary: this.newNetworkRPCDefault,
      newNetworkSymbol: this.newNetworkSymbolDefault,
      newNetworkType: this.newNetworkType,
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
      this.state.newNetworkRPCPrimary !== this.newNetworkRPCDefault ||
      this.state.newNetworkRPCSecondary !== this.newNetworkRPCDefault

    )

    const newNetworkReady = (
      this.state.newNetworkId !== this.newNetworkIdDefault && this.state.newNetworkId !== '' &&
      this.state.newNetworkName !== this.newNetworkNameDefault && this.state.newNetworkName !== '' &&
      this.state.newNetworkExplorer !== this.newNetworkExplorerDefault && this.state.newNetworkExplorer !== ''
    )

    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBox'>
          <div className='addChainTitle'>
            Add New Chain
          </div>
          <div className='addChain'>
            <div className='chainRow'>
              <div className='chainName'>
                <div className='chainInputLabel'>Chain Name</div>
                <input
                  className='chainInput'
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
                  className='chainInput'
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
                  className='chainInput'
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
                  className='chainInput'
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
            </div>

            <div className='chainRow'>
              <div className='chainLayers'>
                <div className='chainInputLabel'>Chain Type</div>
                <div className='chainLayerOptions'>
                  <div className='chainLayerOption'>Rollup</div>
                  <div className='chainLayerOption'>Sidechain</div>
                  <div className='chainLayerOption'>Testnet</div>
                  <div className='chainLayerOption'>Other</div>
                </div>
              </div>
            </div>

            <div className='chainRow'>
              <div className='addChainSubmit'>
                {changedNewNetwork && newNetworkReady ? (
                  <div
                    className='chainSubmit chainSubmitEnabled' onMouseDown={() => {
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
                  <div className='chainSubmit'>
                    {svg.octicon('plus', { height: 17 })}
                  </div>
                )}
                Add Chain
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddChain)