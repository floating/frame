import React, { Component } from 'react'
import Restore from 'react-restore'
import Dropdown from '../../../../resources/Components/Dropdown'
import link from '../../../../resources/link'

class AddToken extends Component {
  constructor (props, context) {
    super(props, context)

    this.nameDefault = 'Token Name'
    this.symbolDefault = 'SYMBOL'
    this.chainIdDefault = 1
    this.decimalsDefault = '?'
    this.addressDefault = 'Contract Address'
    this.logoURIDefault = 'Logo URI'

    this.req = props.req || {}
    this.token = this.req.token || {}
    this.activeChains = props.activeChains

    const chainId = parseInt(this.token.chainId)
    const decimals = parseInt(this.token.decimals)

    this.state = {
      name: this.token.name || this.nameDefault,
      symbol: (this.token.symbol || '').toUpperCase() || this.symbolDefault,
      chainId: (Number.isInteger(chainId) && chainId) || this.chainIdDefault,
      address: (this.token.address || '').toLowerCase() || this.addressDefault,
      decimals: (Number.isInteger(decimals) && decimals) || this.decimalsDefault,
      logoURI: this.token.logoURI || this.logoURIDefault
    }
  }

  async updateTokenData (contractAddress, chainId) {
    const { name, symbol, decimals } = await link.invoke('tray:getTokenDetails', contractAddress, chainId)
    this.setState({
      name: name || this.nameDefault,
      symbol: symbol || this.symbolDefault,
      decimals: decimals || this.decimalsDefault
    })
  }

  isConnectedChain () {
    const chain = this.activeChains.find(({ id }) => id === this.state.chainId)
    return chain.connection.primary.connected || chain.connection.secondary.connected
  }

  isDefault (statePropName) {
    if (this.state[statePropName] === undefined) {
      return false
    }
    return this.state[statePropName] === this[`${statePropName}Default`]
  }

  render () {
    const newTokenReady = (
      this.state.name && this.state.name !== this.nameDefault &&
      this.state.symbol && this.state.symbol !== this.symbolDefault &&
      Number.isInteger(this.state.chainId) &&
      this.state.address && this.state.address !== this.addressDefault &&
      Number.isInteger(this.state.decimals)
    )
    const showTokenAutofillWarning = !this.isConnectedChain()

    return (
      <div className='notifyBoxWrap cardShow' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='addTokenTitle'>
            Add New Token
          </div>
          <div className='addToken'>
            {showTokenAutofillWarning && <div className='tokenRow'>The currently selected chain is not connected. Token autofill will not work.</div>}
            <div className='tokenRow'>
              <div className='tokenName'>
                <label className='tokenInputLabel'>
                  Token Name
                  <input
                    className={`tokenInput tokenInputAddress ${this.isDefault('name') ? 'tokenInputDim' : ''}`}
                    value={this.state.name} spellCheck='false'
                    onChange={(e) => {
                      this.setState({ name: e.target.value })
                    }}
                    onFocus={(e) => {
                      if (e.target.value === this.nameDefault) this.setState({ name: '' })
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') this.setState({ name: this.nameDefault })
                    }}
                  />
                </label>
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenSymbol'>
                <label className='tokenInputLabel'>
                  Symbol
                  <input
                    className={`tokenInput tokenInputAddress ${this.isDefault('symbol') ? 'tokenInputDim' : ''}`}
                    value={this.state.symbol} spellCheck='false'
                    onChange={(e) => {
                      if (e.target.value.length > 10) return e.preventDefault()
                      this.setState({ symbol: e.target.value })
                    }}
                    onFocus={(e) => {
                      if (e.target.value === this.symbolDefault) this.setState({ symbol: '' })
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') this.setState({ symbol: this.symbolDefault })
                    }}
                  />
                </label>

              </div>

              <div className='tokenDecimals'>
                <label className='tokenInputLabel'>
                  Decimals
                  <input
                    className={`tokenInput tokenInputAddress ${this.isDefault('decimals') ? 'tokenInputDim' : ''}`}
                    value={this.state.decimals} spellCheck='false'
                    onChange={(e) => {
                      if (!e.target.value) return this.setState({ decimals: '' })
                      if (e.target.value.length > 2) return e.preventDefault()

                      const decimals = parseInt(e.target.value)
                      if (!Number.isInteger(decimals)) return e.preventDefault()

                      this.setState({ decimals })
                    }}
                    onFocus={(e) => {
                      if (e.target.value === this.decimalsDefault) this.setState({ decimals: '' })
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') this.setState({ decimals: this.decimalsDefault })
                    }}
                  />
                </label>

              </div>

              <div className='tokenChainId'>
                <label className='tokenInputLabel'>
                  Chain
                  <Dropdown
                    syncValue={this.state.chainId}
                    onChange={(chainId) => {
                      this.setState({ chainId })
                      if (this.state.address !== this.addressDefault && this.isConnectedChain()) {
                        this.updateTokenData(this.state.address, chainId)
                      }
                    }}
                    options={this.activeChains.map((chain) => ({ text: chain.name, value: chain.id }))}
                  />
                </label>
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenAddress'>
                <label className='tokenInputLabel'>
                  Contract Address
                  <input
                    className={`tokenInput tokenInputAddress ${this.isDefault('address') ? 'tokenInputDim' : ''}`}
                    value={this.state.address} spellCheck='false'
                    onChange={(e) => {
                      if (e.target.value.length > 42) {
                        return e.preventDefault()
                      }

                      this.setState({ address: e.target.value })
                      if (this.isConnectedChain()) {
                        this.updateTokenData(e.target.value, this.state.chainId)
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value === this.addressDefault) this.setState({ address: '' })
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') this.setState({ address: this.addressDefault })
                    }}
                  />
                </label>
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenLogoUri'>
                <label className='tokenInputLabel'>
                  Logo URI
                  <input
                    className={`tokenInput tokenInputAddress ${this.isDefault('logoURI') ? 'tokenInputDim' : ''}`}
                    value={this.state.logoURI} spellCheck='false'
                    onChange={(e) => {
                      this.setState({ logoURI: e.target.value })
                    }}
                    onFocus={(e) => {
                      if (e.target.value === this.logoURIDefault) this.setState({ logoURI: '' })
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') this.setState({ logoURI: this.logoURIDefault })
                    }}
                  />
                </label>
              </div>
            </div>

            <div className='tokenRow'>
              {newTokenReady ? (
                <div
                  className='addTokenSubmit addTokenSubmitEnabled'
                  onMouseDown={() => {
                    const { name, symbol, chainId, address, decimals, logoURI } = this.state
                    const token = { name, symbol, chainId, address, decimals, logoURI }
                    link.send('tray:addToken', token, this.props.req)
                    setTimeout(() => {
                      link.send('tray:action', 'backDash')
                    }, 400)
                  }}
                >
                  Add Token
                </div>
              ) : (
                <div
                  className='addTokenSubmit'
                >
                  Fill in Token Details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(AddToken)
