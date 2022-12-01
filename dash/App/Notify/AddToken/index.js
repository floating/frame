import React from 'react'
import Restore from 'react-restore'
import link from '../../../../resources/link'

class AddToken extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.nameDefault = 'Token Name'
    this.symbolDefault = 'SYMBOL'
    this.chainDefault = 'ID'
    this.decimalsDefault = '?'
    this.addressDefault = 'Contract Address'
    this.logoURIDefault = 'Logo URI'
    this.token = props.token || {}

    const chainId = parseInt(this.token.chainId)
    const decimals = parseInt(this.token.decimals)

    this.state = {
      name: this.token.name || this.nameDefault,
      symbol: (this.token.symbol || '').toUpperCase() || this.symbolDefault,
      chainId: (Number.isInteger(chainId) && chainId) || this.chainDefault,
      address: (this.token.address || '').toLowerCase() || this.addressDefault,
      decimals: (Number.isInteger(decimals) && decimals) || this.decimalsDefault,
      logoURI: this.token.logoURI || this.logoURIDefault,
    }
  }

  render() {
    const newTokenReady =
      this.state.name &&
      this.state.name !== this.nameDefault &&
      this.state.symbol &&
      this.state.symbol !== this.symbolDefault &&
      Number.isInteger(this.state.chainId) &&
      this.state.address &&
      this.state.address !== this.addressDefault &&
      Number.isInteger(this.state.decimals)

    return (
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='addTokenTitle'>Add New Token</div>
          <div className='addToken'>
            <div className='tokenRow'>
              <div className='tokenName'>
                <div className='tokenInputLabel'>Token Name</div>
                <input
                  className={
                    this.state.name === this.nameDefault
                      ? 'tokenInput tokenInputLarge tokenInputDim'
                      : 'tokenInput tokenInputLarge'
                  }
                  value={this.state.name}
                  spellCheck='false'
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
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenSymbol'>
                <div className='tokenInputLabel'>Symbol</div>
                <input
                  className={
                    this.state.symbol === this.symbolDefault ? 'tokenInput tokenInputDim' : 'tokenInput'
                  }
                  value={this.state.symbol}
                  spellCheck='false'
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
              </div>

              <div className='tokenDecimals'>
                <div className='tokenInputLabel'>Decimals</div>
                <input
                  className={
                    this.state.decimals === this.decimalsDefault ? 'tokenInput tokenInputDim' : 'tokenInput'
                  }
                  value={this.state.decimals}
                  spellCheck='false'
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
              </div>

              <div className='tokenChainId'>
                <div className='tokenInputLabel'>Chain ID</div>
                <input
                  className={
                    this.state.chainId === this.chainDefault ? 'tokenInput tokenInputDim' : 'tokenInput'
                  }
                  value={this.state.chainId}
                  spellCheck='false'
                  onChange={(e) => {
                    if (!e.target.value) return this.setState({ chainId: '' })

                    const chainId = parseInt(e.target.value)
                    if (!Number.isInteger(chainId)) return e.preventDefault()

                    this.setState({ chainId })
                  }}
                  onFocus={(e) => {
                    if (e.target.value === this.chainDefault) this.setState({ chainId: '' })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ chainId: this.chainDefault })
                  }}
                />
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenAddress'>
                <div className='tokenInputLabel'>Contract Address</div>
                <input
                  className={
                    this.state.address === this.addressDefault
                      ? 'tokenInput tokenInputAddress tokenInputDim'
                      : 'tokenInput tokenInputAddress'
                  }
                  value={this.state.address}
                  spellCheck='false'
                  onChange={(e) => {
                    if (e.target.value.length > 42) return e.preventDefault()
                    this.setState({ address: e.target.value })
                  }}
                  onFocus={(e) => {
                    if (e.target.value === this.addressDefault) this.setState({ address: '' })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ address: this.addressDefault })
                  }}
                />
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenLogoUri'>
                <div className='tokenInputLabel'>Logo URI</div>
                <input
                  className={
                    this.state.logoURI === this.logoURIDefault ? 'tokenInput tokenInputDim' : 'tokenInput'
                  }
                  value={this.state.logoURI}
                  spellCheck='false'
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
              </div>
            </div>

            <div className='tokenRow'>
              {newTokenReady ? (
                <div
                  className='addTokenSubmit addTokenSubmitEnabled'
                  onMouseDown={() => {
                    const { name, symbol, chainId, address, decimals, logoURI } = this.state
                    const token = { name, symbol, chainId, address, decimals, logoURI }
                    link.send('tray:addToken', token)
                    setTimeout(() => {
                      this.store.notify()
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

export default Restore.connect(AddToken)
