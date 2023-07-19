import React from 'react'
import Restore from 'react-restore'
import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

import RingIcon from '../../../../resources/Components/RingIcon'
import { NATIVE_CURRENCY } from '../../../../resources/constants'
import { chainUsesEth } from '../../../../resources/utils/chains'

class CustomTokens extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {}
  }

  render() {
    const tokens = this.store('main.tokens.custom')

    return (
      <div className='cardShow' onMouseDown={(e) => e.stopPropagation()}>
        <div className='customTokens'>
          <div className='customTokensList'>
            {tokens.length > 0 ? (
              []
                .concat(tokens)
                .sort((a, b) => {
                  return a.chainId <= b.chainId
                })
                .map((token, i) => {
                  const { address, chainId, media } = token
                  const isNative = address === NATIVE_CURRENCY
                  const chainColor = this.store('main.networksMeta.ethereum', chainId, 'primaryColor')
                  const isEth = isNative && chainUsesEth(chainId)

                  return (
                    <div
                      key={i}
                      className={
                        this.state.tokenExpanded === i
                          ? 'customTokensListItem customTokensListItemExpanded'
                          : 'customTokensListItem'
                      }
                    >
                      <div className='customTokensListItemTitle'>
                        <div className='customTokensListItemName'>
                          <RingIcon
                            thumb={true}
                            media={!isEth && media}
                            svgName={isEth && 'eth'}
                            alt={token.symbol.toUpperCase()}
                            color={chainColor ? `var(--${chainColor})` : ''}
                          />
                          <div className='customTokensListItemText'>
                            <div className='customTokensListItemSymbol'>{token.symbol}</div>
                            <div className='customTokensListItemSub'>{token.name}</div>
                          </div>
                        </div>
                        <div className='customTokensListItemChain'>
                          <div className='customTokensListItemChainLabel'>{'Chain ID:'}</div>
                          <div>{token.chainId}</div>
                          <div
                            className={
                              this.state.tokenExpanded === i
                                ? 'customTokensListItemExpand'
                                : 'customTokensListItemExpand customTokensListItemExpandActive'
                            }
                            onClick={() =>
                              this.setState({ tokenExpanded: this.state.tokenExpanded === i ? -1 : i })
                            }
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
                          setTimeout((_) => this.setState({ copied: false }), 1000)
                        }}
                      >
                        {this.state.copied ? 'Address Copied' : token.address}
                      </div>
                      <div className='customTokensListItemBottom'>
                        <div
                          className='customTokensListItemButton editButton'
                          onClick={() => {
                            link.send('nav:forward', 'dash', {
                              view: 'tokens',
                              data: {
                                notify: 'addToken',
                                notifyData: {
                                  error: null,
                                  isEdit: true,
                                  address: token.address,
                                  chain: { id: token.chainId },
                                  tokenData: token
                                }
                              }
                            })
                          }}
                        >
                          {'Edit Token'}
                        </div>
                        <div
                          className='customTokensListItemButton removeButton'
                          onClick={() => {
                            this.setState({ tokenExpanded: false })
                            setTimeout(() => {
                              link.send('tray:removeToken', token)
                            }, 100)
                          }}
                        >
                          {'Remove Token'}
                        </div>
                      </div>
                    </div>
                  )
                })
            ) : (
              <div className='customTokensListNoTokens'>{'No Custom Tokens'}</div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(CustomTokens)
