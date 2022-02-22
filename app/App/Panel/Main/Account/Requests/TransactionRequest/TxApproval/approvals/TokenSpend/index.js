import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import svg from '../../../../../../../../../../resources/svg'

import { ApprovalType } from '../../../../../../../../../../resources/constants'

const nFormat = (num, digits = 2) => {
  num = Number(num)
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e6, symbol: 'million' },
    { value: 1e9, symbol: 'billion' },
    { value: 1e12, symbol: 'trillion' },
    { value: 1e15, symbol: 'quadrillion' },
    { value: 1e18, symbol: 'quintillion' }
  ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup.slice().reverse().find(function(item) { return num >= item.value })
  return item ? {
    number: (num / item.value).toFixed(digits).replace(rx, '$1'),
    symbol: item.symbol
  } : {
    number: '0',
    symbol: ''
  }
}

const MAX_HEX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

class TokenSpend extends React.Component {
  constructor (...args) {
    super(...args)

    this.decimals = this.props.approval.data.decimals
    this.requestedAmount = '0x' + new BigNumber(this.props.approval.data.amount).integerValue().toString(16)
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

  render () {
    const { req, approval } = this.props
    const { data } = approval

    const displayInt = new BigNumber(this.state.amount).shiftedBy(-this.decimals).integerValue()

    const displayAmount = this.state.amount === MAX_HEX ? {
      number: '',
      symbol: 'unlimited'
    } : displayInt > 9e12 ? {
      number: '',
      symbol: '~unlimited'
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
            onClick={() => this.props.onDecline(req)}
          >
            Reject
          </div>
          <div
            className={this.state.inEditApproval ? 'approveTokenSpendEditButton approveTokenSpendDoneButton' : 'approveTokenSpendEditButton'}
            onClick={() => {
              this.setState({ inEditApproval: !this.state.inEditApproval })
            }}
          >
            {this.state.inEditApproval ? 'Done' : 'Edit' }
          </div>
          <div
            className='approveTransactionWarningProceed'
            role='button'
            style={this.state.inEditApproval ? {
              opacity: 0,
              pointerEvents: 'none'
            } : {}}
            onClick={() => {
              this.props.onApprove(
                this.props.req, 
                ApprovalType.TokenSpendApproval,
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
          <div className='approveTransactionWarningTitle'>{'token approval'}</div>
          {this.state.inEditApproval ? (
            <div className='approveTokenSpend'>
              <div className='approveTokenSpendEdit'>
                <div className='approveTokenSpendEditTitle'>
                  {'Token Spend Limit'}
                </div>
                <div className='approveTokenSpendAmount'>
                  <div className='approveTokenSpendSymbol'>
                    {symbol}
                  </div>
                  {this.state.mode === 'custom' ? inputLock ? (
                    <div className='approveTokenSpendAmountNoInput'>
                      <div className='approveTokenSpendAmountNoInputSymbol'>{'cannot set unknown'}</div>
                    </div>
                  ) : (
                    <input 
                      autoFocus
                      value={this.state.customInput}
                      onChange={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        this.setCustomAmount(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') return this.setState({ inEditApproval: false })
                      }}
                    />
                  ) : (
                    <div>
                      <div 
                        className='approveTokenSpendAmountNoInput'
                        onClick={() => {
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
                  <div className={this.state.mode === 'requested' ? 'approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected' : 'approveTokenSpendPresetButton'}
                    onClick={() => {
                      this.setState({ mode: 'requested', amount: this.requestedAmount })
                    }}
                  >
                    Requested
                  </div>
                  <div 
                    className={this.state.mode === 'unlimited' ? 'approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected' : 'approveTokenSpendPresetButton'}
                    onClick={() => {
                      const amount = MAX_HEX
                      this.setState({ mode: 'unlimited', amount })
                    }}
                  >
                    <span className='approveTokenSpendPresetButtonInfinity'>{'Unlimited'}</span>
                  </div>
                  <div 
                    className={this.state.mode === 'custom' ? 'approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected' : 'approveTokenSpendPresetButton'}
                    onClick={() => {
                      this.setCustomAmount(this.state.customInput)
                    }}
                  >
                    Custom
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='approveTokenSpend'>
              <div className='approveTokenSpendDescription'>
                {data.contract ? (
                  <div className='approveTokenSpendContractAddress'>
                    <div className='approveTokenSpendContractAddressLarge'>
                      {data.contract.substring(0, 6)}
                      {svg.octicon('kebab-horizontal', { height: 15 })}
                      {data.contract.substr(data.contract.length - 4)}
                    </div>
                    <div className='approveTokenSpendContractAddressFull'>
                      {data.contract}
                    </div>
                  </div>
                ) : null}
                <div className='approveTokenSpendSub'>
                  {'wants approval to spend'}
                </div>
                <div className='approveTokenSpendToken'>
                  {symbol}
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
