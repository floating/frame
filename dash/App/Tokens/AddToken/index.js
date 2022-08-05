import React, { Component } from 'react'
import Restore from 'react-restore'
import RingIcon from '../../../../resources/Components/RingIcon'
import chainMeta from '../../../../resources/chainMeta'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

class AddTokenChainScreen extends Component {
  constructor (props, context) {
    super(props, context)
    this.state = {}
  }
  
  render () {
    const { store } = this.props
    const { chainId } = this.state
    return <div className='newTokenView cardShow'>
      <div className='newTokenChainSelectTitle'>
        {'What chain is this token on?'}
      </div>
      <div className='newTokenChainSelectChain'>
      <div className='originSwapChainList'>
        {Object.keys(store('main.networks.ethereum'))
          .filter(id => store('main.networks.ethereum', id, 'on'))
          .map(id => {
            const intId = parseInt(id)
            const hexId = '0x' + intId.toString('16')
            const selected = chainId === intId
            const chainName = store('main.networks.ethereum', id, 'name')
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
                  this.setState({ chainId: intId })
                  setTimeout(() => {
                    link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken', notifyData: { chainId: intId }} })
                  }, 200)
                }}
              >
                <div className='originChainItemIcon'>
                  <RingIcon
                    color={chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'}
                    img={chainMeta[hexId] ? chainMeta[hexId].icon : ''}
                  />
                </div>

                {chainName}

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
      </div>
      <div className='newTokenChainSelectFooter'>
        {'Chain not listed? Enable it in Chains'}
      </div>
    </div>
  }
}

class AddTokenAddressScreen extends Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      inputAddress: '',
    }
    this.updateTokenData = props.updateTokenData
  }

  isConnectedChain () {
    const { chainId, activeChains } = this.props
    const chain = activeChains.find(({ id }) => id === chainId)
    return chain.connection.primary.connected || chain.connection.secondary.connected
  }

  render () {
    const { chainId, chainName } = this.props
    const hexId = '0x' + parseInt(chainId).toString('16')
    return (
      <div className='newTokenView cardShow'>
        <div className='newTokenChainSelectTitle'>
          <label id='newTokenAddressLabel'>{`What is the token's contract address?`}</label>
          {chainName ? (
            <div 
              className='newTokenChainSelectSubtitle'
              style={{
                color: chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'
              }}
            >
              {`on ${chainName}`}
            </div>
          ) : null}
        </div>

        <div className='tokenRow'>
          <div className='tokenAddress'>
            <input
              aria-labelledby='newTokenAddressLabel'
              className='tokenInput tokenInputAddress'
              value={this.state.inputAddress} 
              spellCheck={false}
              autoFocus={true}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  this.setState({ address: this.state.inputAddress })
                  if (this.isConnectedChain()) {
                    this.updateTokenData(this.state.inputAddress, chainId)
                  }
                  link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken', notifyData: { address: this.state.inputAddress, chainId }} })
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
      <div
        className='tokenSetAddress'
        role='button'
        onClick={() => {
          this.setState({ address: this.state.inputAddress })
          if (this.isConnectedChain()) {
            this.updateTokenData(this.state.inputAddress, chainId)
          }
          link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken', notifyData: { address: this.state.inputAddress, chainId }} })
        }}
      >
        {'Set Address'}
      </div>
    </div>
    )
  }
}


class AddTokenFormScreen extends Component {
  constructor (props, context) {
    super(props, context)

    this.nameDefault = 'Token Name'
    this.symbolDefault = 'SYMBOL'
    this.decimalsDefault = '?'
    this.logoURIDefault = 'Logo URI'
    this.activeChains = props.activeChains
    this.state = {
      name: props.tokenData.name || this.nameDefault,
      symbol: props.tokenData.symbol || this.symbolDefault,
      decimals: props.tokenData.decimals || this.decimalsDefault,
      logoURI: this.logoURIDefault
    }
  }

  componentDidUpdate(prevProps) {
    const { tokenData } = this.props
    if (tokenData !== prevProps.tokenData) {
      this.setState({ ...tokenData })
    }
  }

  isDefault (statePropName) {
    if (this.state[statePropName] === undefined) {
      return false
    }
    return this.state[statePropName] === this[`${statePropName}Default`]
  }

  render () {
    const { chainId, chainName, req, tokenData: { address } } = this.props
    const newTokenReady = (
      this.state.name && this.state.name !== this.nameDefault &&
      this.state.symbol && this.state.symbol !== this.symbolDefault &&
      Number.isInteger(chainId) &&
      address &&
      Number.isInteger(this.state.decimals)
    )
    const hexId = '0x' + parseInt(chainId).toString('16')
    console.log('chainId', chainId)
    console.log('address', address)
    
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
              {chainName ? (
                <div 
                  className='newTokenChainSelectSubtitle'
                  style={{
                    color: chainMeta[hexId] ? chainMeta[hexId].primaryColor : 'var(--moon)'
                  }}
                >
                  {`on ${chainName}`}
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
                    const { name, symbol, address, decimals, logoURI } = this.state
                    const token = { name, symbol, chainId, address, decimals, logoURI }
                    link.send('tray:addToken', token, req)
                    setTimeout(() => {
                      link.send('tray:action', 'backDash')
                      link.send('tray:action', 'backDash')
                      link.send('tray:action', 'backDash')
                    }, 400)
                  }}
                >
                  Add Token
                </div>
              ) : (
                <div className='addTokenSubmit'>
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

class AddToken extends Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      tokenData: {
        name: '',
        symbol: '',
        decimals: ''
      }
    }
  }

  async updateTokenData (contractAddress, chainId) {
    console.log('updateTokenData', contractAddress, chainId)
    const { name, symbol, decimals } = await link.invoke('tray:getTokenDetails', contractAddress, chainId)
    console.log('retrieved', name, symbol, decimals)
    this.setState({ tokenData: { name, symbol, decimals }})
  }

  render () {
    const { activeChains, data, req } = this.props
    const address = data && data.notifyData && data.notifyData.address
    const chainId = data && data.notifyData && data.notifyData.chainId
    const chainName = chainId ? this.store('main.networks.ethereum', chainId, 'name') : undefined

    console.log('data', data.notifyData)
    console.log('chainId', chainId)
    console.log('address', address)

    if (!chainId) {
      return <AddTokenChainScreen store={this.store} />
    } else if (!address) {
      return <AddTokenAddressScreen chainId={chainId} chainName={chainName} activeChains={activeChains} updateTokenData={this.updateTokenData.bind(this)} />
    }
    
    const tokenData = { address, ...this.state.tokenData }

    return <AddTokenFormScreen chainId={chainId} chainName={chainName} req={req} activeChains={activeChains} tokenData={tokenData} />
  }
}

export default Restore.connect(AddToken)
