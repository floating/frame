import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../../../../resources/link'
import svg from '../../../../../../../../resources/svg'

import { ApprovalType } from '../../../../../../../../resources/constants'

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

const MAX_INT = Math.pow(2, 256) - 1

class TxApproval extends React.Component {
  constructor (...args) {
    super(...args)
    this.decimals = this.props.tokenApproval.decimals
    this.requestedAmount = new BigNumber(this.props.tokenApproval.requestedAmount).shiftedBy(-this.decimals).toNumber()
    this.maxAmount = this.decimals && new BigNumber(MAX_INT).shiftedBy(-this.decimals).toNumber()

    this.state = {
      inPreview: false,
      inEditApproval: false,
      mode: 'requested',
      amount: this.requestedAmount,
      customInput: ''
    }
  }

  decline (req) {
    link.rpc('declineRequest', req, () => {})
  }

  approve () {
    const approvalData = {
      amount: new BigNumber(this.state.amount).shiftedBy(this.decimals)
    }

    link.rpc(
      'confirmRequestApproval', 
      this.props.req, 
      ApprovalType.TokenSpendApproval, 
      approvalData, 
      () => {
        console.log('confirmRequestApproval cb')
      }
    )
  }

  setAmount (amount) {
    this.setState({ amount })
  }

  render () {
    const { 
      message,
      title,
      req,
      editValue,
      tokenApproval,
      type
    } = this.props

    const displayAmount = this.state.amount > 9e15 ? {
      number: '',
      symbol: 'unlimited'
    } : nFormat(this.state.amount)

    return (
      <div className='approveTransactionWarning'>
        <div className='approveTransactionWarningOptions'>
          <div
            className='approveTransactionWarningReject'
            style={this.state.inEditApproval ? {
              opacity: 0,
              pointerEvents: 'none'
            } : {}}
            onClick={() => this.decline(req)}
          >Reject
          </div>
          {this.props.type === 'approveTokenSpend' ? (
            <div
              className={this.state.inEditApproval ? 'approveTokenSpendEditButton approveTokenSpendDoneButton' : 'approveTokenSpendEditButton'}
              onClick={() => {
                this.setState({ inEditApproval: !this.state.inEditApproval })
              }}
            >
              {this.state.inEditApproval ? 'Done' : 'Edit' }
            </div>
          ) : (
            <div
              className='approveTransactionWarningPreview'
              onMouseEnter={() => {
                this.setState({ inPreview: true })
              }}
              onMouseMove={() => {
                this.setState({ inPreview: true })
              }}
              onMouseLeave={() => {
                this.setState({ inPreview: false })
              }}
            >
              Preview
            </div>
          )}
          <div
            className='approveTransactionWarningProceed'
            style={this.state.inEditApproval ? {
              opacity: 0,
              pointerEvents: 'none'
            } : {}}
            onClick={this.approve.bind(this)}
          >Proceed
          </div>
        </div>
        <div className='approveTransactionWarningFill' style={this.state.inPreview ? { opacity: 0 } : { opacity: 1 }}>
          <div className='approveTransactionWarningIcon approveTransactionWarningIconLeft'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningIcon approveTransactionWarningIconRight'>
            {svg.alert(32)}
          </div>
          <div className='approveTransactionWarningTitle'>{title}</div>
          {type === 'approveTokenSpend' ? this.state.inEditApproval ? (
            <div className='approveTokenSpend'>
              <div className='approveTokenSpendEdit'>
                <div className='approveTokenSpendEditTitle'>
                  {'Token Spend Limit'}
                </div>
                <div className='approveTokenSpendAmount'>
                  <div className='approveTokenSpendSymbol'>
                    {tokenApproval.symbol}
                  </div>
                  {this.state.mode === 'custom' ? (
                    <input 
                      autoFocus
                      value={this.state.customInput}
                      onChange={(e) => {
                        this.setState({ mode: 'custom', amount: new BigNumber(e.target.value).toNumber(), customInput: e.target.value })
                      }}
                    />
                  ) : (
                    <div>
                      <div className='approveTokenSpendAmountNoInput'>
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
                      this.setState({ mode: 'unlimited', amount: this.maxAmount })
                    }}
                  >
                    <span className='approveTokenSpendPresetButtonInfinity'>{'Unlimited'}</span>
                  </div>
                  <div 
                    className={this.state.mode === 'custom' ? 'approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected' : 'approveTokenSpendPresetButton'}
                    onClick={() => {
                      this.setState({ mode: 'custom', amount: parseFloat(this.state.customInput) })
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
                {tokenApproval.contract ? (
                  <div className='approveTokenSpendContractAddress'>
                    <div className='approveTokenSpendContractAddressLarge'>
                      {tokenApproval.contract.substring(0, 6)}
                      {svg.octicon('kebab-horizontal', { height: 15 })}
                      {tokenApproval.contract.substr(tokenApproval.contract.length - 4)}
                    </div>
                    <div className='approveTokenSpendContractAddressFull'>
                      {tokenApproval.contract}
                    </div>
                  </div>
                ) : null}
                <div className='approveTokenSpendSub'>
                  {'wants approval to spend'}
                </div>
                <div className='approveTokenSpendToken'>
                  {tokenApproval.symbol}
                </div>
                <div className='approveTokenSpendTokenName'>
                  {tokenApproval.name}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className='approveTransactionWarningMessage'>
                <div className='approveTransactionWarningMessageInner'>
                  {message}
                </div>
                {
                  editValue ? React.cloneElement(editValue) : null
                }
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxApproval)
