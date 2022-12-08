import { isAddress } from 'ethers/lib/utils'
import React, { Component } from 'react'
import Restore from 'react-restore'
import RingIcon from '../../../../resources/Components/RingIcon'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

const AddTokenErrorSceeen = ({ error, reset, next }) => {
  return (
    <div className='newTokenView cardShow'>
      <div className='newTokenChainSelectTitle'>{error}</div>

      <div className='tokenSetAddress' role='button' onClick={() => reset()}>
        {'BACK'}
      </div>
      <div className='tokenSetAddress' role='button' onClick={() => next()}>
        {'ADD ANYWAY'}
      </div>
    </div>
  )
}

class AddTokenChainScreenComponent extends Component {
  constructor(...args) {
    super(...args)

    this.state = {
      chainId: 0
    }
  }

  render() {
    const { chainId: selectedChainId } = this.state

    const activeChains = Object.values(this.store('main.networks.ethereum')).filter((chain) => chain.on)

    return (
      <div className='newTokenView cardShow'>
        <div className='newTokenChainSelectTitle'>{`Select token's chain`}</div>
        <div className='newTokenChainSelectChain'>
          <div className='originSwapChainList'>
            {activeChains.map((chain) => {
              const chainId = chain.id
              const selected = selectedChainId === chainId
              const { primaryColor, icon } = this.store('main.networksMeta.ethereum', chainId)
              const chainName = chain.name

              return (
                <div
                  className='originChainItem'
                  key={chainId}
                  role='button'
                  onClick={() => {
                    this.setState({ chainId })

                    setTimeout(() => {
                      link.send('tray:action', 'navDash', {
                        view: 'tokens',
                        data: { notify: 'addToken', notifyData: { chainId } }
                      })
                    }, 200)
                  }}
                >
                  <div className='originChainItemIcon'>
                    <RingIcon
                      color={primaryColor ? `var(--${primaryColor})` : 'var(--moon)'}
                      img={icon}
                      small={true}
                    />
                  </div>
                  {chainName}
                </div>
              )
            })}
          </div>
        </div>
        <div className='newTokenChainSelectFooter'>
          {'Chain not listed?'}
          <div
            className='newTokenEnableChainLink'
            role='link'
            onClick={() => {
              link.send('tray:action', 'navDash', { view: 'chains', data: {} })
            }}
          >
            {'Enable it in Chains'}
          </div>
        </div>
      </div>
    )
  }
}

const AddTokenChainScreen = Restore.connect(AddTokenChainScreenComponent)

class AddTokenAddressScreenComponent extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      inputAddress: ''
    }
  }

  isConnectedChain() {
    const activeChains = Object.values(this.store('main.networks.ethereum')).filter((chain) => chain.on)
    const chain = activeChains.find(({ id }) => id === this.props.chainId)

    return chain.connection.primary.connected || chain.connection.secondary.connected
  }

  submit(address) {
    const { chainId } = this.props

    if (this.isConnectedChain()) {
      this.props.updateTokenData(address, chainId)
    }

    link.send('tray:action', 'navDash', {
      view: 'tokens',
      data: {
        notify: 'addToken',
        notifyData: {
          address,
          chainId
        }
      }
    })
  }

  render() {
    const { chainId, chainName } = this.props
    const chainColor = this.store('main.networksMeta.ethereum', chainId, 'primaryColor')

    return (
      <div className='newTokenView cardShow'>
        <div className='newTokenChainSelectTitle'>
          <label id='newTokenAddressLabel'>{`Enter token's address`}</label>
          {chainName ? (
            <div
              className='newTokenChainSelectSubtitle'
              style={{
                color: chainColor ? `var(--${chainColor})` : 'var(--moon)'
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
                  this.submit(this.state.inputAddress)
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
            this.submit(this.state.inputAddress)
          }}
        >
          {'Set Address'}
        </div>
      </div>
    )
  }
}

const AddTokenAddressScreen = Restore.connect(AddTokenAddressScreenComponent)

class AddTokenFormScreenComponent extends Component {
  constructor(props, context) {
    super(props, context)

    this.nameDefault = 'Token Name'
    this.symbolDefault = 'SYMBOL'
    this.decimalsDefault = '?'
    this.logoURIDefault = 'Logo URI'

    this.state = this.stateFromTokenData(props.tokenData)
  }

  stateFromTokenData(tokenData) {
    return {
      address: tokenData.address || '',
      name: tokenData.name || this.nameDefault,
      symbol: tokenData.symbol || this.symbolDefault,
      decimals: tokenData.decimals || this.decimalsDefault,
      logoURI: tokenData.logoURI || this.logoURIDefault
    }
  }

  componentDidUpdate(prevProps) {
    const { tokenData } = this.props
    if (tokenData !== prevProps.tokenData) {
      this.setState(this.stateFromTokenData(tokenData))
    }
  }

  isDefault(statePropName) {
    if (this.state[statePropName] === undefined) {
      return false
    }
    return this.state[statePropName] === this[`${statePropName}Default`]
  }

  render() {
    const {
      chainId,
      chainName,
      req,
      tokenData: { address }
    } = this.props
    const newTokenReady =
      this.state.name &&
      this.state.name !== this.nameDefault &&
      this.state.symbol &&
      this.state.symbol !== this.symbolDefault &&
      Number.isInteger(chainId) &&
      address &&
      Number.isInteger(this.state.decimals)
    const chainColor = this.store('main.networksMeta.ethereum', chainId, 'primaryColor')

    return (
      <div className='notifyBoxWrap cardShow' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='addTokenTop'>
            <div className='addTokenTitle'>Add New Token</div>
            <div className='newTokenChainSelectTitle'>
              <div className='newTokenChainAddress' role='heading' aria-level='2'>
                {address.substring(0, 10)}
                {svg.octicon('kebab-horizontal', { height: 14 })}
                {address.substring(address.length - 8)}
              </div>
              {chainName ? (
                <div
                  className='newTokenChainSelectSubtitle'
                  style={{
                    color: chainColor ? `var(--${chainColor})` : 'var(--moon)'
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
                    const token = {
                      name,
                      symbol,
                      chainId,
                      address,
                      decimals,
                      logoURI: this.isDefault('logoURI') ? '' : logoURI
                    }
                    link.send('tray:addToken', token, req)
                    setTimeout(() => {
                      link.send('tray:action', 'backDash', 3)
                    }, 400)
                  }}
                >
                  Add Token
                </div>
              ) : (
                <div className='addTokenSubmit'>Fill in Token Details</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const AddTokenFormScreen = Restore.connect(AddTokenFormScreenComponent)

class AddToken extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      tokenData: {
        name: '',
        symbol: '',
        decimals: '',
        totalSupply: ''
      },
      error: null
    }
  }

  async updateTokenData(contractAddress, chainId) {
    const isValidAddress = isAddress(contractAddress)
    if (!isValidAddress) return this.setState({ error: 'Invalid contract address' })
    const tokenData = await link.invoke('tray:getTokenDetails', contractAddress, chainId)
    const error = tokenData.totalSupply ? null : 'UNABLE TO CONFIRM TOKEN DATA ON CHAIN'
    this.setState({ tokenData, error })
  }

  reset() {
    this.setState({
      tokenData: {
        name: '',
        symbol: '',
        decimals: '',
        totalSupply: ''
      },
      error: null
    })
  }

  setError(error) {
    this.setState({ error })
  }

  render() {
    const { data, req } = this.props
    const address = data && data.notifyData && data.notifyData.address
    const chainId = data && data.notifyData && data.notifyData.chainId
    const chainName = chainId ? this.store('main.networks.ethereum', chainId, 'name') : undefined
    const {
      error,
      hasFetched,
      tokenData: { totalSupply }
    } = this.state
    if (error)
      return (
        <AddTokenErrorSceeen
          error={error}
          reset={this.reset.bind(this)}
          next={() => this.setState({ error: null, tokenData: { totalSupply: '0' } })}
        />
      )
    if (!chainId) {
      return <AddTokenChainScreen />
    } else if (!totalSupply) {
      return (
        <AddTokenAddressScreen
          chainId={chainId}
          chainName={chainName}
          updateTokenData={this.updateTokenData.bind(this)}
        />
      )
    }

    const tokenData = { address, ...this.state.tokenData }

    return <AddTokenFormScreen chainId={chainId} chainName={chainName} req={req} tokenData={tokenData} />
  }
}

export default Restore.connect(AddToken)
