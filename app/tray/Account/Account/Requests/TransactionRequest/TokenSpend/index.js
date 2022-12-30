import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'
import {
  ClusterBox,
  Cluster,
  ClusterRow,
  ClusterValue
} from '../../../../../../../resources/Components/Cluster'
import { MAX_HEX } from '../../../../../../../resources/constants'
import { formatDisplayInteger, isUnlimited } from '../../../../../../../resources/utils/numbers'

class TokenSpend extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      inPreview: false,
      inEditApproval: false,
      mode: 'requested',
      customInput: ''
    }
  }

  setAmount(amount) {
    this.setState({ amount })
  }

  setCustomAmount(value, decimals) {
    if (value === '') {
      this.setState({ mode: 'custom', amount: '0x0', customInput: value })
    } else {
      // only allow ints
      if (!/^\d+$/.test(value)) return

      const max = new BigNumber(MAX_HEX)
      const custom = new BigNumber(value).shiftedBy(decimals)

      let amount
      if (max.comparedTo(custom) === -1) {
        amount = MAX_HEX
      } else {
        amount = '0x' + custom.integerValue().toString(16)
      }

      this.setState({ mode: 'custom', amount, customInput: value })
    }
  }

  startEditing() {
    this.setState({ inEditApproval: true })
  }

  copySpenderAddress(data) {
    link.send('tray:clipboardData', data)
    this.setState({ copiedSpenderAddress: true })
    setTimeout(() => this.setState({ copiedSpenderAddress: false }), 1000)
  }

  copyTokenAddress(data) {
    link.send('tray:clipboardData', data)
    this.setState({ copiedTokenAddress: true })
    setTimeout(() => this.setState({ copiedTokenAddress: false }), 1000)
  }

  render() {
    const { approval, updateApproval, requestedAmountHex } = this.props

    const { data } = approval
    const decimals = data.decimals || 0
    const requestedAmount = requestedAmountHex
    const customInput =
      '0x' + new BigNumber(this.state.customInput).shiftedBy(decimals).integerValue().toString(16)
    const value = new BigNumber(data.amount)
    const revoke = value.eq(0)

    const displayAmount = isUnlimited(data.amount) ? 'unlimited' : formatDisplayInteger(data.amount, decimals)

    const symbol = data.symbol || '???'
    const name = data.name || 'Unknown Token'

    const inputLock = !data.symbol || !data.name || !decimals

    const spenderEns = data.spenderEns
    const spender = data.spender

    const tokenAddress = data.contract

    return (
      <div className='updateTokenApproval'>
        <ClusterBox title={'token approval details'} style={{ marginTop: '64px' }}>
          <Cluster>
            <ClusterRow>
              <ClusterValue
                pointerEvents={'auto'}
                onClick={() => {
                  this.copySpenderAddress(spender)
                }}
              >
                <div className='clusterAddress'>
                  {spenderEns ? (
                    <span className='clusterAddressRecipient'>{spenderEns}</span>
                  ) : (
                    <span className='clusterAddressRecipient'>
                      {spender.substring(0, 8)}
                      {svg.octicon('kebab-horizontal', { height: 15 })}
                      {spender.substring(spender.length - 6)}
                    </span>
                  )}
                  <div className='clusterAddressRecipientFull'>
                    {this.state.copiedSpenderAddress ? (
                      <span>{'Address Copied'}</span>
                    ) : (
                      <span className='clusterFira'>{spender}</span>
                    )}
                  </div>
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue>
                <div className='clusterTag' style={{ color: 'var(--moon)' }}>
                  {this.state.mode === 'custom' && !this.state.customInput ? (
                    <span>{'set approval to spend'}</span>
                  ) : revoke ? (
                    <span>{'revoke approval to spend'}</span>
                  ) : (
                    <span>{'grant approval to spend'}</span>
                  )}
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue
                pointerEvents={'auto'}
                onClick={() => {
                  this.copyTokenAddress(tokenAddress)
                }}
              >
                <div className='clusterAddress'>
                  <span className='clusterAddressRecipient'>{name}</span>
                  <div className='clusterAddressRecipientFull'>
                    {this.state.copiedTokenAddress ? (
                      <span>{'Address Copied'}</span>
                    ) : (
                      <span className='clusterFira'>{tokenAddress}</span>
                    )}
                  </div>
                </div>
              </ClusterValue>
            </ClusterRow>
          </Cluster>
          <Cluster style={{ marginTop: '16px' }}>
            <ClusterRow>
              <ClusterValue transparent={true} pointerEvents={'auto'}>
                <div className='approveTokenSpendAmount'>
                  <div className='approveTokenSpendAmountLabel'>{symbol}</div>
                  {this.state.mode === 'custom' && data.amount !== customInput ? (
                    <div
                      className='approveTokenSpendAmountSubmit'
                      role='button'
                      onClick={() => {
                        if (this.state.customInput === '') {
                          this.setState({ mode: 'requested', amount: requestedAmount })
                          updateApproval(requestedAmount)
                        } else {
                          updateApproval(this.state.amount)
                        }
                      }}
                    >
                      {'update'}
                    </div>
                  ) : (
                    <div
                      key={this.state.mode + data.amount}
                      className='approveTokenSpendAmountSubmit'
                      style={{ color: 'var(--good)' }}
                    >
                      {svg.check(20)}
                    </div>
                  )}
                  {this.state.mode === 'custom' ? (
                    <input
                      autoFocus
                      type='text'
                      aria-label='Custom Amount'
                      value={this.state.customInput}
                      onChange={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        this.setCustomAmount(e.target.value, decimals)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur()
                          if (this.state.customInput === '') {
                            this.setState({ mode: 'requested', amount: requestedAmount })
                            updateApproval(requestedAmount)
                          } else {
                            updateApproval(this.state.amount)
                          }
                        }
                      }}
                    />
                  ) : (
                    <div
                      className='approveTokenSpendAmountNoInput'
                      role='textbox'
                      style={inputLock ? { cursor: 'default' } : null}
                      onClick={
                        inputLock
                          ? null
                          : () => {
                              this.setCustomAmount(this.state.customInput, decimals)
                            }
                      }
                    >
                      {displayAmount}
                    </div>
                  )}
                  <div className='approveTokenSpendAmountSubtitle'>Set Token Approval Spend Limit</div>
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue
                onClick={() => {
                  this.setState({ mode: 'requested', amount: requestedAmount })
                  updateApproval(requestedAmount)
                }}
                role='button'
              >
                <div
                  className='clusterTag'
                  style={this.state.mode === 'requested' ? { color: 'var(--good)' } : {}}
                >
                  {'Requested'}
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue
                onClick={() => {
                  const amount = MAX_HEX
                  this.setState({ mode: 'unlimited', amount })
                  updateApproval(amount)
                }}
                role='button'
              >
                <div
                  className='clusterTag'
                  style={this.state.mode === 'unlimited' ? { color: 'var(--good)' } : {}}
                >
                  {'Unlimited'}
                </div>
              </ClusterValue>
            </ClusterRow>
            {!inputLock && (
              <ClusterRow>
                <ClusterValue
                  onClick={() => {
                    this.setCustomAmount(this.state.customInput, decimals)
                  }}
                  role='button'
                >
                  <div
                    className={'clusterTag'}
                    style={this.state.mode === 'custom' ? { color: 'var(--good)' } : {}}
                  >
                    Custom
                  </div>
                </ClusterValue>
              </ClusterRow>
            )}
          </Cluster>
        </ClusterBox>
      </div>
    )
  }
}

export default Restore.connect(TokenSpend)
