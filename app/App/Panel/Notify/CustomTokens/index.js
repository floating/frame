import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../../resources/svg'
import link from '../../../../../resources/link'

class CustomTokens extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = {}
  }

  render () {
    const tokens = this.store('main.tokens.custom')    

    return (
      <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <div className='customTokens'>
            <div className='customTokensTitle'>
              <div
                className='customTokensTitleText'
              >
                Custom Tokens
              </div>
              <div
                className='customTokensAddToken'
                onClick={() => this.store.notify('addToken', this.props.req)}
              >
                Add Token
              </div>
            </div>
            <div className='customTokensList'>
              {tokens.length > 0 ? [].concat(tokens).sort((a, b) => {
                return a.chainId <= b.chainId
              }).map((token, i) => {
                return (
                  <div className={this.state.tokenExpanded === i ? 'customTokensListItem customTokensListItemExpanded' : 'customTokensListItem'}>
                    <div className='customTokensListItemTitle'>
                      <div className='customTokensListItemName'>
                        <img src={`https://proxy.pylon.link?type=icon&target=${token.logoURI}`} />
                        <div className='customTokensListItemText'>
                          <div className='customTokensListItemSymbol'>{token.symbol}</div>
                          <div className='customTokensListItemSub'>{token.name}</div>
                        </div>
                      </div>
                      <div className='customTokensListItemChain'>
                        <div className='customTokensListItemChainLabel'>
                          {'Chain ID:'}
                        </div>
                        <div>
                          {token.chainId}
                        </div>
                        <div 
                          className={this.state.tokenExpanded === i  ? 'customTokensListItemExpand' : 'customTokensListItemExpand customTokensListItemExpandActive'}
                          onClick={() => this.setState({ tokenExpanded: this.state.tokenExpanded === i ? -1 : i })}
                        >
                          {svg.octicon('chevron-down', { height: 16 })}
                        </div>
                      </div>
                    </div>
                    <div 
                      className='customTokensListItemAddress'
                      onClick={() => {
                        link.send('tray:clipboardData', token.address)
                        this.setState({ copied: true })
                        setTimeout(_ => this.setState({ copied: false }), 1000)
                      }}
                    >
                      {this.state.copied ? 'Address Copied' : token.address}
                    </div>
                    <div className='customTokensListItemBottom'>
                      <div className='customTokensListItemChainDecimal'>
                        <div className='customTokensListItemChainLabel'>
                          {'Decimals:'}
                        </div>
                        <div>
                          {token.decimals}
                        </div>
                      </div>
                      <div className='customTokensListItemRemoveButton'
                           onClick={() => link.send('tray:removeToken', token)}
                      >
                        {'Remove Token'}
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div className='customTokensListNoTokens'>
                  {'No Custom Tokens'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(CustomTokens)
