import React, { Component } from 'react'
import Restore from 'react-restore'
import RingIcon from '../../../../resources/Components/RingIcon'
import chainMeta from '../../../../resources/chainMeta'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

class AddToken extends Component {
  constructor (props, context) {
    super(props, context)

    this.nameDefault = 'Token Name'
    this.symbolDefault = 'SYMBOL'
    // this.chainIdDefault = 1
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
      _chainId: Number.isInteger(chainId) && chainId,
      chainId: Number.isInteger(chainId) && chainId,
      inputAddress: (this.token.address || '').toLowerCase(),
      address: (this.token.address || '').toLowerCase(),
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

  updateOriginChain () {
    // const origin = this.store('main.origins', this.props.originId)
    return (
      <div className='originSwapChainList'>
        {Object.keys(this.store('main.networks.ethereum'))
          .filter(id => this.store('main.networks.ethereum', id, 'on'))
          .map(id => {
            const hexId = '0x' + parseInt(id).toString('16')
            const selected = this.state._chainId === parseInt(id)
            return (
              <div 
                className='originChainItem'
                key={id}
                role='button'
                style={selected ? {
                  color: 'var(--ghostB)',
                  background: chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'
                } : {}}
                onClick={() => {
                  this.setState({ _chainId: parseInt(id) })
                  setTimeout(() => {
                    this.setState({ chainId: parseInt(id) })
                  }, 200)
                }}
              >
                <div className='originChainItemIcon'>
                  <RingIcon 
                    color={chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'} 
                    img={chainMeta[hexId] ? chainMeta[hexId].icon : ''} 
                  />
                </div>
                
                {this.store('main.networks.ethereum', id, 'name')}

                <div 
                  className='originChainItemCheck'
                  style={selected ? {
                    background: chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'
                  } : {}}
                >
                  {selected ? svg.check(28) : null}
                </div>
              </div>
            )
          })}
      </div>
    )
  }

  render () {
    const currentChain = this.state.chainId ? this.store('main.networks.ethereum', this.state.chainId, 'name') : undefined

    const newTokenReady = (
      this.state.name && this.state.name !== this.nameDefault &&
      this.state.symbol && this.state.symbol !== this.symbolDefault &&
      Number.isInteger(this.state.chainId) &&
      this.state.address && this.state.address !== this.addressDefault &&
      Number.isInteger(this.state.decimals)
    )

    if (!this.state.chainId) {
      return (
        <div className='newTokenView cardShow'>
          <div className='newTokenChainSelectTitle'>
            {'What chain is this token on?'}
          </div>
          <div className='newTokenChainSelectChain'>
            {this.updateOriginChain()}
          </div>
          <div className='newTokenChainSelectFooter'>
            {'Chain not listed? Enable it in Chains'}
          </div>
        </div>
      )
    } else if (!this.state.address) {
      const hexId = '0x' + parseInt(this.state.chainId).toString('16')
      return (
        <div className='newTokenView cardShow'>
          <div className='newTokenChainSelectTitle'>
            <label id='newTokenAddressLabel'>{`What is the token's contract address?`}</label>
            {currentChain ? (
              <div 
                className='newTokenChainSelectSubtitle'
                style={{
                  color: chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'
                }}
              >
                {`on ${currentChain}`}
              </div>
            ) : null}

            <div className='tokenRow'>
              <div className='tokenAddress'>
                <input
                  aria-labelledby='newTokenAddressLabel'
                  className={`tokenInput tokenInputAddress ${this.isDefault('address') ? 'tokenInputDim' : ''}`}
                  value={this.state.inputAddress} 
                  spellCheck={false}
                  autoFocus={true}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      this.setState({ address: this.state.inputAddress })
                      if (this.isConnectedChain()) {
                        this.updateTokenData(this.state.inputAddress, this.state.chainId)
                      }
                    } 
                  }}
                  onChange={(e) => {
                    if (e.target.value.length > 42) {
                      e.preventDefault()
                    } else {
                      this.setState({ inputAddress: e.target.value })
                    }
                  }}
                />

              </div>
            </div>
          </div>
          <div 
            className='tokenSetAddress'
            role='button'
            onClick={() => {
              this.setState({ address: this.state.inputAddress })
              if (this.isConnectedChain()) {
                this.updateTokenData(this.state.inputAddress, this.state.chainId)
              }
            }}
          >
            {'Set Address'}
          </div>
        </div>
      )
    } else {
      const address = this.state.address || ''
      const hexId = '0x' + parseInt(this.state.chainId).toString('16')
      return (
        <div className='notifyBoxWrap cardShow' onMouseDown={e => e.stopPropagation()}>
          <div className='notifyBoxSlide'>
            <div className='addTokenTop'>
              <div className='addTokenTitle'>
                Add New Token
              </div>
              <div className='newTokenChainSelectTitle'>
                <div className='newTokenChainAddress'>
                  {address.substring(0, 10)}
                  {svg.octicon('kebab-horizontal', { height: 14 })}
                  {address.substring(address.length - 8)}
                </div>
                {currentChain ? (
                  <div 
                    className='newTokenChainSelectSubtitle'
                    style={{
                      color: chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'
                    }}
                  >
                    {`on ${currentChain}`}
                  </div>
                ) : null}
              </div>
            </div>
            <div className='addToken'>
              <div className='tokenRow'>
                <div className='tokenName'>
                  <label className='tokenInputLabel'>
                    <input
                      className={`tokenInput ${this.isDefault('name') ? 'tokenInputDim' : ''}`}
                      value={this.state.name} 
                      spellCheck={false}
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
                    Token Name
                  </label>
                </div>
              </div>
  
              <div className='tokenRow'>
                <div className='tokenSymbol'>
                  <label className='tokenInputLabel'>
                    <input
                      className={`tokenInput ${this.isDefault('symbol') ? 'tokenInputDim' : ''}`}
                      value={this.state.symbol} 
                      spellCheck={false}
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
                    Symbol
                  </label>
  
                </div>
  
                <div className='tokenDecimals'>
                  <label className='tokenInputLabel'>
                    <input
                      className={`tokenInput ${this.isDefault('decimals') ? 'tokenInputDim' : ''}`}
                      value={this.state.decimals} 
                      spellCheck={false}
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
                    Decimals
                  </label>

                </div>
              </div>
  
              <div className='tokenRow'>
                <div className='tokenLogoUri'>
                  <label className='tokenInputLabel'>
                    <input
                      className={`tokenInput ${this.isDefault('logoURI') ? 'tokenInputDim' : ''}`}
                      value={this.state.logoURI} 
                      spellCheck={false}
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
                     Logo URI
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
}

export default Restore.connect(AddToken)
