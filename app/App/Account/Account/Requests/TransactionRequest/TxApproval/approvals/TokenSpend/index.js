import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import svg from '../../../../../../../../../resources/svg'
import link from '../../../../../../../../../resources/link'

import { ADDRESS_DISPLAY_CHARS, ApprovalType } from '../../../../../../../../../resources/constants'

const numberRegex = /\.0+$|(\.[0-9]*[1-9])0+$/
const MAX_HEX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

const digitsLookup = [
  { value: 1, symbol: '' },
  { value: 1e6, symbol: 'million' },
  { value: 1e9, symbol: 'billion' },
  { value: 1e12, symbol: 'trillion' },
  { value: 1e15, symbol: 'quadrillion' },
  { value: 1e18, symbol: 'quintillion' }
]

function nFormat (n, digits = 2)  {
  const num = Number(n)
  const item = digitsLookup.slice().reverse().find(item => num >= item.value)

  return item ? {
    number: (num / item.value).toFixed(digits).replace(numberRegex, '$1'),
    symbol: item.symbol
  } : {
    number: '0',
    symbol: ''
  }
}

class TokenSpend extends React.Component {
  constructor (...args) {
    super(...args)
    const { approval: { data } } = this.props

    this.decimals = data.decimals || 0
    this.requestedAmount = '0x' + new BigNumber(data.amount).integerValue().toString(16)
    this.state = {
      inPreview: false,
      inEditApproval: false,
      mode: 'requested',
      amount: this.requestedAmount,
      customInput: ''
    }
  }

  setAmount (amount) {
    this.setState({ amount })
  }

  setCustomAmount (value) {
    if (value === '') {
      this.setState({ mode: 'custom', amount: '0x0', customInput: value })
    } else {
      const max = new BigNumber(MAX_HEX)
      const custom = new BigNumber(value).shiftedBy(this.decimals)

      let amount
      if (max.comparedTo(custom) === -1) {
        amount = MAX_HEX
      } else {
        amount = '0x' + custom.integerValue().toString(16)
      }

      this.setState({ mode: 'custom', amount, customInput: value })
    }
  }

  startEditing () {
    this.setState({ inEditApproval: true })
  }

  doneEditing () {
    if (this.state.mode === 'custom' && this.state.customInput === '') {
      this.setState({ mode: 'requested', amount: this.requestedAmount })
    }

    this.setState({ exiting: true })
    setTimeout(() => {
      this.setState({ exiting: false, inEditApproval: false })
    }, 600)
  }

  render () {
    const { req, revoke, approval, onApprove, onDecline } = this.props
    const { data } = approval

    const displayInt = new BigNumber(this.state.amount).shiftedBy(-this.decimals).integerValue()

    const displayAmount = this.state.amount === MAX_HEX ? {
      number: '',
      symbol: 'unlimited'
    } : displayInt > 9e12 ? {
      number: '',
      symbol: approval.data.decimals ? '~unlimited' : 'unknown'
    } : nFormat(displayInt)

    const symbol = data.symbol || '???'
    const name = data.name || 'Unknown Token'

    const inputLock = !data.symbol || !data.name || !this.decimals

    return (
      <div className='approveTransactionWarning'>
        <div className='approveTransactionWarningOptions'>
          <div
            className='approveTransactionWarningReject'
            role='button'
            style={this.state.inEditApproval ? {
              opacity: 0,
              pointerEvents: 'none'
            } : {}}
            onClick={() => onDecline(req)}
          >
            Reject
          </div>
          {!revoke && 
            <div
              className={this.state.inEditApproval ? 'approveTokenSpendEditButton approveTokenSpendDoneButton' : 'approveTokenSpendEditButton'}
              role='button'
              onClick={() => {
                if (this.state.inEditApproval) {
                  this.doneEditing()
                } else {
                  this.startEditing()
                }
              }}
            >
              {this.state.inEditApproval ? 'Done' : 'Edit' }
            </div>
          }
          <div
            className='approveTransactionWarningProceed'
            role='button'
            style={this.state.inEditApproval ? {
              opacity: 0,
              pointerEvents: 'none'
            } : {}}
            onClick={() => {
              onApprove(
                req,
                revoke ? ApprovalType.TokenSpendRevocation : ApprovalType.TokenSpendApproval,
                { amount: this.state.amount }
              )
            }}
          >
            Proceed
          </div>
        </div>
        <div className='approveTransactionWarningFill'>
          <div className='approveTransactionWarningIcon approveTransactionWarningIconLeft'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningIcon approveTransactionWarningIconRight'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningTitle'>{revoke ? 'revoke token approval' : 'token approval'}</div>
          {this.state.inEditApproval ? (
            <div className={'approveTokenSpend'}>
              {this.state.exiting ? (
                <div className='approveTokenSpendConfirm'>
                  {displayAmount.number ? <div className='approveTokenSpendConfirmNumber'>{displayAmount.number}</div> : null}
                  {displayAmount.symbol ? <div className='approveTokenSpendConfirmNumberText'>{displayAmount.symbol}</div> : null}
                  <div className='approveTokenSpendConfirmSymbol'>{data.symbol}</div>
                </div>
              ) : (
                <div className='approveTokenSpendEdit'>
                  <div className='approveTokenSpendEditTitle'>
                    {'Token Spend Limit'}
                  </div>
                  <div className='approveTokenSpendAmount'>
                    <div className='approveTokenSpendSymbol'>
                      {symbol}
                    </div>
                    {this.state.mode === 'custom' ? (
                      <input
                        autoFocus
                        type='text'
                        aria-label='Custom Amount'
                        value={this.state.customInput}
                        onChange={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          this.setCustomAmount(e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') return this.doneEditing()
                        }}
                      />
                    ) : (
                      <div>
                        <div
                          className='approveTokenSpendAmountNoInput'
                          role='textbox'
                          style={inputLock ? { cursor: 'default' } : null}
                          onClick={inputLock ? null : () => {
                            this.setCustomAmount(this.state.customInput)
                          }}
                        >
                          <div className='approveTokenSpendAmountNoInputNumber'>{displayAmount.number}</div>
                          <div className='approveTokenSpendAmountNoInputSymbol'>{displayAmount.symbol}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className='approveTokenSpendPresets'>
                    <div
                      className={this.state.mode === 'requested' ? 'approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected' : 'approveTokenSpendPresetButton'}
                      role='button'
                      onClick={() => {
                        this.setState({ mode: 'requested', amount: this.requestedAmount })
                      }}
                    >
                      Requested
                    </div>
                    <div
                      className={this.state.mode === 'unlimited' ? 'approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected' : 'approveTokenSpendPresetButton'}
                      role='button'
                      onClick={() => {
                        const amount = MAX_HEX
                        this.setState({ mode: 'unlimited', amount })
                      }}
                    >
                      <span className='approveTokenSpendPresetButtonInfinity'>{'Unlimited'}</span>
                    </div>
                    {!inputLock ? (
                      <div
                        className={this.state.mode === 'custom' ? 'approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected' : 'approveTokenSpendPresetButton'}
                        role='button'
                        onClick={() => {
                          this.setCustomAmount(this.state.customInput)
                        }}
                      >
                        Custom
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='approveTokenSpend'>
              <div className='approveTokenSpendDescription'>
                {data.spender ? (
                  <div className='approveTokenSpendSpenderAddress'>
                    <div className='approveTokenSpendSpenderAddressLarge'>
                      {
                        // 0x prefix plus leading characters of address
                        data.spender.substring(0, 2 + ADDRESS_DISPLAY_CHARS)
                      }
                      {svg.octicon('kebab-horizontal', { height: 15 })}
                      {data.spender.substr(data.contract.length - ADDRESS_DISPLAY_CHARS)}
                    </div>
                    <div
                      className='approveTokenSpendSpenderAddressFull'
                      onClick={() => {
                        link.send('tray:clipboardData', data.spender)
                        this.setState({ copyTokenRequester: true })
                        setTimeout(() => {
                          this.setState({ copyTokenRequester: false })
                        }, 1000)
                      }}
                    >
                      {this.state.copyTokenRequester ? 'ADDRESS COPIED' : data.spender}
                    </div>
                  </div>
                ) : null}
                <div className='approveTokenSpendSub'>
                  {revoke ? 'wants to revoke approval to spend' : 'wants approval to spend'}
                </div>
                <div className='approveTokenSpendToken'>
                  <div className='approveTokenSpendTokenSymbol'>
                    {symbol}
                  </div>
                  <div
                    className='approveTokenSpendTokenContract'
                    onClick={() => {
                      link.send('tray:clipboardData', data.contract)
                      this.setState({ copyTokenContract: true })
                      setTimeout(() => {
                        this.setState({ copyTokenContract: false })
                      }, 1000)
                    }}
                  >
                    {this.state.copyTokenContract ? 'ADDRESS COPIED' : data.contract}
                  </div>
                </div>
                <div className='approveTokenSpendTokenName'>
                  {name}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(TokenSpend)
