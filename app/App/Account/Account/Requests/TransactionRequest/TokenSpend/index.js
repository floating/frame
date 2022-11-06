import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../../../resources/Components/Cluster'

import { ADDRESS_DISPLAY_CHARS, MAX_HEX } from '../../../../../../../resources/constants'

const numberRegex = /\.0+$|(\.[0-9]*[1-9])0+$/

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
  return item ? (num / item.value).toFixed(digits).replace(numberRegex, '$1') : '0'
}

class TokenSpend extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      inPreview: false,
      inEditApproval: false,
      mode: 'requested',
      customInput: ''
    }
  }

  setAmount (amount) {
    this.setState({ amount })
  }

  setCustomAmount (value, decimals) {
    if (value === '') {
      this.setState({ mode: 'custom', amount: '0x0', customInput: value })
    } else {
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

  startEditing () {
    this.setState({ inEditApproval: true })
  }

  updateApproval (amount) {
    const { handlerId, actionId } = this.props
    link.rpc('updateRequest', handlerId, actionId, { amount }, () => {})
  }

  copySpenderAddress (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copiedSpenderAddress: true })
    setTimeout(() => this.setState({ copiedSpenderAddress: false }), 1000)
  }

  copyTokenAddress (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copiedTokenAddress: true })
    setTimeout(() => this.setState({ copiedTokenAddress: false }), 1000)
  }

  render () {
    const { accountId, handlerId, actionId, requestedAmountHex } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    if (!req) return null
    const approval = (req.recognizedActions || []).find(action => action.id === actionId)
    if (!approval) return null
    const { data } = approval
    const decimals = data.decimals || 0
    const requestedAmount = requestedAmountHex
    const customInput = '0x' + new BigNumber(this.state.customInput).shiftedBy(decimals).integerValue().toString(16)
    const value = new BigNumber(data.amount)
    const revoke = value.eq(0)

    const displayInt = value.shiftedBy(-decimals).integerValue()

    const displayAmount = data.amount === MAX_HEX 
      ? 'unlimited' 
      : displayInt > 9e12 
        ? decimals ? '~unlimited' : 'unknown' 
        : nFormat(displayInt)

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
              <ClusterValue pointerEvents={'auto'} onClick={() => {
                this.copySpenderAddress(spender)
              }}>
                <div className='clusterAddress'>
                  {spenderEns
                    ? <span className='clusterAddressRecipient'>{spenderEns}</span>
                    : <span className='clusterAddressRecipient'>{spender.substring(0, 8)}{svg.octicon('kebab-horizontal', { height: 15 })}{spender.substring(spender.length - 6)}</span>
                  }
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
              <ClusterValue pointerEvents={'auto'} onClick={() => {
                this.copyTokenAddress(tokenAddress )
              }}>
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
                  <div className='approveTokenSpendAmountLabel'>
                    {symbol}
                  </div>
                  {this.state.mode === 'custom' && data.amount !== customInput ? (
                    <div className='approveTokenSpendAmountSubmit'>
                      {'update'}
                    </div>
                  ) : (
                    <div 
                      key={this.state.mode + data.amount}
                      className='approveTokenSpendAmountSubmit' 
                      style={{ color: 'var(--good)' 
                    }}>
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
                            this.updateApproval(requestedAmount)
                          } else {
                            this.updateApproval(this.state.amount)
                          }  
                        }
                      }}
                    />
                  ) : (
                    <div
                      className='approveTokenSpendAmountNoInput'
                      role='textbox'
                      style={inputLock ? { cursor: 'default' } : null}
                      onClick={inputLock ? null : () => {
                        this.setCustomAmount(this.state.customInput, decimals)
                      }}
                    > 
                      <div className='approveTokenSpendAmountNoInputNumber'>
                        {displayAmount}
                      </div>
                    </div>
                  )}
                  <div className='approveTokenSpendAmountSubtitle'>
                    Set Token Approval Spend Limit
                  </div>
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue onClick={() => {
                this.setState({ mode: 'requested', amount: requestedAmount })
                this.updateApproval(requestedAmount)
              }}>
                <div 
                  className='clusterTag'
                  style={this.state.mode === 'requested' ? { color: 'var(--good)' } : {}}
                  role='button'
                >
                  {'Requested'}
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue onClick={() => {
                const amount = MAX_HEX
                this.setState({ mode: 'unlimited', amount })
                this.updateApproval(amount)
              }}>
                <div 
                  className='clusterTag'
                  style={this.state.mode === 'unlimited' ? { color: 'var(--good)' } : {}}
                  role='button'
                >
                  {'Unlimited'}
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue onClick={() => {
                this.setCustomAmount(this.state.customInput, decimals)
              }}>
                {!inputLock ? (
                  <div
                    className={'clusterTag'}
                    style={this.state.mode === 'custom' ? { color: 'var(--good)' } : {}}
                    role='button'
                  >
                    Custom
                  </div>
                ) : null}
              </ClusterValue>
            </ClusterRow>
          </Cluster>
        </ClusterBox>
      </div>
    )
  }
}

export default Restore.connect(TokenSpend)
