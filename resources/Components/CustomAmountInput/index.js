import React, { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'

import svg from '../../svg'
import link from '../../link'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../Cluster'

import { MAX_HEX } from '../../constants'
import { formatDisplayInteger } from '../../utils/numbers'

const max = new BigNumber(MAX_HEX)

const isMax = (value) => max.isEqualTo(value)

const getMode = (requestedAmount, amount) => {
  if (requestedAmount === amount) return 'requested'
  return isMax(amount) ? 'unlimited' : 'custom'
}

const CustomAmountInput = ({ data, updateRequest, requestedAmount, deadline }) => {
  const decimals = data.decimals || 0

  const toDecimalString = (valueStr) => new BigNumber(valueStr).shiftedBy(-1 * decimals).toString()

  const [mode, setMode] = useState(getMode(requestedAmount, data.amount))
  const [custom, setCustom] = useState(toDecimalString(data.amount))
  const [amount, setAmount] = useState(data.amount)
  const [copiedSpender, setCopiedSpender] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const isCustom = mode === 'custom' && custom
  const value = new BigNumber(amount)

  const setInputAndAmount = (value) => {
    if (!value) {
      setAmount('0')
      setCustom('0')
      return setMode('custom')
    }

    if (!/^\d+$/.test(value)) return

    const custom = new BigNumber(value).shiftedBy(decimals)
    const amount = max.comparedTo(custom) === -1 ? max.toString() : custom.toString()
    setMode('custom')
    setAmount(amount)
    setCustom(value)
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

  const revoke = value.eq(0)

  const displayAmount = isMax(data.amount) ? 'unlimited' : formatDisplayInteger(data.amount, decimals)

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
                {mode === 'custom' && !custom ? (
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
          {deadline && <Countdown end={deadline} handleClick={() => {}} title={'Permission Expires in'} />}
        </Cluster>

        <Cluster style={{ marginTop: '16px' }}>
          <ClusterRow>
            <ClusterValue transparent={true} pointerEvents={'auto'}>
              <div className='approveTokenSpendAmount'>
                <div className='approveTokenSpendAmountLabel'>{symbol}</div>
                {isCustom && data.amount !== amount ? (
                  <div
                    className='approveTokenSpendAmountSubmit'
                    role='button'
                    onClick={() => {
                      if (custom === '') {
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
                    value={custom}
                    onChange={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setInputAndAmount(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        console.log({ customInput: custom, amount })
                        e.target.blur()
                        if (custom === '') {
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
                            setCustom('')
                            setMode('custom')
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
                  setMode('custom')
                  setCustom('')
                }}
              >
                <div className={'clusterTag'} style={isCustom ? { color: 'var(--good)' } : {}} role='button'>
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
