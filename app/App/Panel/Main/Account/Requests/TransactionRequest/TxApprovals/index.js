import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../../../resources/link'
import svg from '../../../../../../../../resources/svg'

const MAX_INT = Math.pow(2, 256) - 1

class TxApproval extends React.Component {
  constructor (...args) {
    super(...args)

    this.state = {
      inPreview: false,
      inEditApproval: false
    }
  }

  decline (req) {
    link.rpc('declineRequest', req, () => {})
  }

  render () {
    const { 
      message,
      title,
      req,
      onApprove,
      editValue,
      tokenApproval,
      updateApprovalAmount,
      type
    } = this.props

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
            onClick={onApprove}
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
                  <input 
                    value={tokenApproval.amount.toNumber() === MAX_INT ? '~UNLIMITED' : tokenApproval.amount}
                    onChange={(e) => {
                      if (updateApprovalAmount) updateApprovalAmount(e.target.value)
                    }}
                  />
                </div>
                <div className='approveTokenSpendPresets'>
                  <div className='approveTokenSpendPresetButton approveTokenSpendPresetButtonSelected'>
                    Requested
                  </div>
                  <div 
                    className='approveTokenSpendPresetButton'
                    onClick={() => {
                      if (updateApprovalAmount) updateApprovalAmount(MAX_INT)
                    }}
                  >
                    <span className='approveTokenSpendPresetButtonTilda'>{'~'}</span>
                    <span className='approveTokenSpendPresetButtonInfinity'>{svg.infinity(20)}</span>
                  </div>
                  <div 
                    className='approveTokenSpendPresetButton'
                    onClick={() => {
                      if (updateApprovalAmount) updateApprovalAmount('0')
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
