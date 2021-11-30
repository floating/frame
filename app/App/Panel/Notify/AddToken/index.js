import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../resources/svg'
import link from '../../../../../resources/link'

class AddToken extends React.Component {
  constructor (props, context) {
    super(props, context)

    this.nameDefault = 'Token Name'
    this.symbolDefault = 'Symbol'
    this.chainDefault = 'Chain ID'
    this.addressDefault = 'Contract Address'
    this.logoURIDefault = 'Token Logo URI'
    
    this.req = props.req || {}
    this.token = this.req.token || {}

    const chainId = parseInt(this.token.chainId)
    const decimals = parseInt(this.token.decimals)

    this.state = {
      name: this.token.name || this.nameDefault,
      symbol: (this.token.symbol || '').toUpperCase() || this.symbolDefault,
      chainId: (Number.isInteger(chainId) && chainId) || this.chainDefault,
      address: (this.token.address || '').toLowerCase() || this.addressDefault,
      decimals: (Number.isInteger(decimals) && decimals) || 18,
      logoURI: this.token.logoURI || this.logoURIDefault
    }
  }

  render () {
    const newTokenReady = (
      this.state.name && this.state.name !== this.nameDefault &&
      this.state.symbol && this.state.symbol !== this.symbolDefault &&
      Number.isInteger(this.state.chainId) &&
      this.state.address && this.state.address !== this.addressDefault &&
      Number.isInteger(this.state.decimals)
    )

    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='addTokenTitle'>
            Add New Token
          </div>
          <div className='addToken'>
            <div className='tokenRow'>
              <div className='tokenName'>
                <div className='tokenInputLabel'>Token Name</div>
                <input
                  className='tokenInput tokenInputLarge'
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
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenSymbol'>
                <div className='tokenInputLabel'>Symbol</div>
                <input
                  className='tokenInput'
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
              </div>

              <div className='tokenChainId'>
                <div className='tokenInputLabel'>Chain ID</div>
                <input
                  className='tokenInput'
                  value={this.state.chainId} spellCheck='false'
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

              <div className='tokenDecimals'>
                <div className='tokenInputLabel'>Decimals</div>
                <input
                  className='tokenInput'
                  value={this.state.decimals} spellCheck='false'
                  onChange={(e) => {
                    if (!e.target.value) return this.setState({ decimals: '' })
                    if (e.target.value.length > 2) return e.preventDefault()

                    const decimals = parseInt(e.target.value)
                    if (!Number.isInteger(decimals)) return e.preventDefault()

                    this.setState({ decimals })
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') this.setState({ decimals: 18 })
                  }}
                />
              </div>
            </div>

            <div className='tokenRow'>
              <div className='tokenAddress'>
                <div className='tokenInputLabel'>Address</div>
                <input
                  className='tokenInput'
                  value={this.state.address} spellCheck='false'
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
                  className='tokenInput'
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
                      this.store.notify()
                    }, 400)
                  }}
                >
                  {svg.octicon('plus', { height: 17 })} Add Token
                </div>
              ) : (
                <div 
                  className='addTokenSubmit' 
                >
                  {svg.octicon('plus', { height: 17 })} Fill in Token Details
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
