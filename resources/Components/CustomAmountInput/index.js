import React, { useState } from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import svg from '../../svg'
import link from '../../link'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../Cluster'

import { MAX_HEX } from '../../constants'
import { formatDisplayInteger, isUnlimited } from '../../utils/numbers'

const max = new BigNumber(MAX_HEX)

const CustomAmountInput = ({ data, updateRequest, requestedAmountHex, deadline }) => {
  const [mode, setMode] = useState('requested')
  const [customInput, setCustomInput] = useState('')
  const [amount, setAmount] = useState(data.amount)

  //TODO: useCopied hook
  const [copiedSpender, setCopiedSpender] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const formatAndSetCustomInput = (value, decimals) => {
    if (!value) {
      setCustomInput('')
      setAmount('0x0')
      return setMode('custom')
    }

    if (!/^\d+$/.test(value)) return

    const custom = new BigNumber(value).shiftedBy(decimals)
    const amount = max.comparedTo(custom) === -1 ? MAX_HEX : '0x' + custom.toString(16)
    setMode('custom')
    setAmount(amount)
    setCustomInput(value)
  }

  const copySpenderAddress = () => {
    link.send('tray:clipboardData', data.spender)
    setCopiedSpender(true)
    setTimeout(() => setCopiedSpender(false), 1000)
  }

  const copyTokenAddress = () => {
    link.send('tray:clipboardData', data.contract)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 1000)
  }

  const decimals = data.decimals || 0
  const requestedAmount = requestedAmountHex

  const value = new BigNumber(amount)
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
                copySpenderAddress()
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
                  {copiedSpender ? (
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
                {mode === 'custom' && !customInput ? (
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
                copyTokenAddress()
              }}
            >
              <div className='clusterAddress'>
                <span className='clusterAddressRecipient'>{name}</span>
                <div className='clusterAddressRecipientFull'>
                  {copiedToken ? (
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
                {mode === 'custom' && data.amount !== customInput ? (
                  <div
                    className='approveTokenSpendAmountSubmit'
                    role='button'
                    onClick={() => {
                      if (customInput === '') {
                        setMode('requested')
                        setAmount(requestedAmount)
                        updateRequest(requestedAmount)
                      } else {
                        updateRequest(amount)
                      }
                    }}
                  >
                    {'update'}
                  </div>
                ) : (
                  <div
                    key={mode + data.amount}
                    className='approveTokenSpendAmountSubmit'
                    style={{ color: 'var(--good)' }}
                  >
                    {svg.check(20)}
                  </div>
                )}
                {mode === 'custom' ? (
                  <input
                    autoFocus
                    type='text'
                    aria-label='Custom Amount'
                    value={customInput}
                    onChange={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      formatAndSetCustomInput(e.target.value, decimals)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur()
                        if (customInput === '') {
                          setMode('requested')
                          setAmount(requestedAmount)
                          updateRequest(requestedAmount)
                        } else {
                          updateRequest(amount)
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
                            formatAndSetCustomInput(customInput, decimals)
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
                setMode('requested')
                setAmount(requestedAmount)
                updateRequest(requestedAmount)
              }}
            >
              <div
                className='clusterTag'
                style={mode === 'requested' ? { color: 'var(--good)' } : {}}
                role='button'
              >
                {'Requested'}
              </div>
            </ClusterValue>
          </ClusterRow>
          <ClusterRow>
            <ClusterValue
              onClick={() => {
                const amount = MAX_HEX
                setMode('unlimited')
                setAmount(MAX_HEX)
                updateRequest(amount)
              }}
            >
              <div
                className='clusterTag'
                style={mode === 'unlimited' ? { color: 'var(--good)' } : {}}
                role='button'
              >
                {'Unlimited'}
              </div>
            </ClusterValue>
          </ClusterRow>
          {!inputLock && (
            <ClusterRow>
              <ClusterValue
                onClick={() => {
                  formatAndSetCustomInput(customInput, decimals)
                }}
              >
                <div
                  className={'clusterTag'}
                  style={mode === 'custom' ? { color: 'var(--good)' } : {}}
                  role='button'
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

export default CustomAmountInput
