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

const Details = ({ address, name }) => {
  const [isCopied, setCopied] = useState(false)

  const copyAddress = () => {
    link.send('tray:clipboardData', address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <ClusterRow>
      <ClusterValue
        pointerEvents={'auto'}
        onClick={() => {
          copyAddress()
        }}
      >
        <div className='clusterAddress'>
          <span className='clusterAddressRecipient'>
            {name || (
              <>
                {address.substring(0, 8)}
                {svg.octicon('kebab-horizontal', { height: 15 })}
                {address.substring(address.length - 6)}
              </>
            )}
          </span>
          <div className='clusterAddressRecipientFull'>
            {isCopied ? <span>{'Address Copied'}</span> : <span className='clusterFira'>{address}</span>}
          </div>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}

const Description = ({ mode, custom, isRevoke }) => (
  <ClusterRow>
    <ClusterValue>
      <div className='clusterTag' style={{ color: 'var(--moon)' }}>
        {mode === 'custom' && !custom ? (
          <span>{'set approval to spend'}</span>
        ) : isRevoke ? (
          <span>{'revoke approval to spend'}</span>
        ) : (
          <span>{'grant approval to spend'}</span>
        )}
      </div>
    </ClusterValue>
  </ClusterRow>
)

const CustomAmountInput = ({
  data,
  updateRequest: updateHandlerRequest,
  requestedAmount,
  deadline,
  canRevoke = false
}) => {
  const {
    decimals = 0,
    symbol = '???',
    name = 'Unknown Token',
    spenderEns,
    spender,
    contract: tokenAddress,
    amount
  } = data

  const toDecimal = (baseAmount) => new BigNumber(baseAmount).shiftedBy(-1 * decimals).toString()
  const fromDecimal = (decimalAmount) => new BigNumber(decimalAmount).shiftedBy(decimals).toString()

  const [mode, setMode] = useState(getMode(requestedAmount, amount))
  const [custom, setCustom] = useState('')

  useEffect(() => {
    setCustom(toDecimal(amount))
  }, [])

  const value = new BigNumber(amount)

  const updateCustomAmount = (value) => {
    if (!value) {
      setCustom('0')
      return setMode('custom')
    }

    if (!/^\d+$/.test(value)) return

    const custom = new BigNumber(value).shiftedBy(decimals)
    const amount = max.comparedTo(custom) === -1 ? max.toString() : custom.toString()
    setMode('custom')
    setCustom(value)
  }

  const resetToRequestAmount = () => {
    setCustom(toDecimal(requestedAmount))
    setMode('requested')
    updateHandlerRequest(requestedAmount)
  }

  const setToMax = () => {
    console.log('setting to max')
    setMode('unlimited')
    updateHandlerRequest(max.toString())
  }

  const isRevoke = canRevoke && value.eq(0)
  const isCustom = mode === 'custom'

  const displayAmount = isMax(amount) ? 'unlimited' : formatDisplayInteger(amount, decimals)

  const inputLock = !symbol || !name || !decimals

  return (
    <div className='updateTokenApproval'>
      <ClusterBox title={'token approval details'} style={{ marginTop: '64px' }}>
        <Cluster>
          <Details
            {...{
              address: spender,
              name: spenderEns
            }}
          />
          <Description
            {...{
              isRevoke,
              mode,
              custom
            }}
          />
          <Details
            {...{
              address: tokenAddress,
              name
            }}
          />
          {deadline && <Countdown end={deadline} title={'Permission Expires in'} />}
        </Cluster>

        <Cluster style={{ marginTop: '16px' }}>
          <ClusterRow>
            <ClusterValue transparent={true} pointerEvents={'auto'}>
              <div className='approveTokenSpendAmount'>
                <div className='approveTokenSpendAmountLabel'>{symbol}</div>
                {isCustom && amount !== fromDecimal(custom) ? (
                  <div
                    className='approveTokenSpendAmountSubmit'
                    role='button'
                    onClick={() =>
                      custom === '' ? resetToRequestAmount() : updateHandlerRequest(fromDecimal(custom))
                    }
                  >
                    {'update'}
                  </div>
                ) : (
                  <div
                    key={mode + amount}
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
                      updateCustomAmount(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        console.log({ customInput: custom })
                        e.target.blur()
                        if (custom === '') return resetToRequestAmount()
                        updateHandlerRequest(fromDecimal(custom))
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
            <ClusterValue onClick={() => resetToRequestAmount()}>
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
                setToMax()
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
