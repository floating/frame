import { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'

import { max } from '../../utils/numbers'
import svg from '../../svg'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../Cluster'
import Countdown from '../Countdown'

import useCopiedMessage from '../../Hooks/useCopiedMessage'

const isMax = (value) => max.isEqualTo(value)

const getMode = (requestedAmount, amount) => {
  if (requestedAmount.eq(amount)) return 'requested'
  return isMax(amount) ? 'unlimited' : 'custom'
}

const isValidInput = (value, decimals) => {
  const strValue = value.toString()
  return !isNaN(value) && value > 0 && (!strValue.includes('.') || strValue.split('.')[1].length <= decimals)
}

const Details = ({ address, name }) => {
  const [showCopiedMessage, copyAddress] = useCopiedMessage(address)

  return (
    <ClusterRow>
      <ClusterValue
        pointer={true}
        onClick={() => {
          copyAddress()
        }}
      >
        <div className='clusterAddress'>
          <span className='clusterAddressRecipient'>
            {name ? (
              <span className='clusterAddressRecipient' style={{ fontFamily: 'MainFont', fontWeight: '400' }}>
                {name}
              </span>
            ) : (
              <>
                {address.substring(0, 8)}
                {svg.octicon('kebab-horizontal', { height: 15 })}
                {address.substring(address.length - 6)}
              </>
            )}
          </span>
          <div className='clusterAddressRecipientFull'>
            {showCopiedMessage ? (
              <span>{'Address Copied'}</span>
            ) : (
              <span className='clusterFira'>{address}</span>
            )}
          </div>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}

const Description = ({ isRevoke }) => (
  <ClusterRow>
    <ClusterValue>
      <div className='clusterTag' style={{ color: 'var(--moon)' }}>
        {isRevoke ? <span>{'revoke approval to spend'}</span> : <span>{'grant approval to spend'}</span>}
      </div>
    </ClusterValue>
  </ClusterRow>
)

const EditTokenSpend = ({
  data,
  updateRequest: updateHandlerRequest,
  requestedAmount,
  deadline,
  canRevoke = false
}) => {
  const { decimals = 0, symbol = '???', name = 'Unknown Token', spender, contract, amount } = data

  const toDecimal = (baseAmount) => new BigNumber(baseAmount).shiftedBy(-1 * decimals).toString(10)
  const fromDecimal = (decimalAmount) => new BigNumber(decimalAmount).shiftedBy(decimals).toString(10)

  const [mode, setMode] = useState(getMode(requestedAmount, amount))
  const [custom, setCustom] = useState('')

  useEffect(() => {
    setCustom(toDecimal(amount))
  }, [])

  const value = new BigNumber(amount)

  const updateCustomAmount = (value, decimals) => {
    if (!value) {
      setCustom('0')
      return setMode('custom')
    }

    if (!isValidInput(value, decimals)) return
    setMode('custom')
    setCustom(value)
  }

  const resetToRequestAmount = () => {
    setCustom(toDecimal(requestedAmount))
    setMode('requested')
    updateHandlerRequest(requestedAmount.toString(10))
  }

  const setToMax = () => {
    setMode('unlimited')
    updateHandlerRequest(max.toString(10))
  }

  const isRevoke = canRevoke && value.eq(0)
  const isCustom = mode === 'custom'

  const displayAmount = isMax(amount) ? 'unlimited' : toDecimal(amount)

  const inputLock = !data.symbol || !data.name || !data.decimals

  return (
    <div className='updateTokenApproval'>
      <ClusterBox title={'token approval details'} style={{ marginTop: '64px' }}>
        <Cluster>
          <Details
            {...{
              address: spender.address,
              name: spender.ens
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
              address: contract.address,
              name
            }}
          />
          {deadline && (
            <ClusterRow>
              <ClusterValue>
                <Countdown
                  end={deadline}
                  title={'Permission Expires in'}
                  innerClass='clusterFocusHighlight'
                  titleClass='clusterFocus'
                />
              </ClusterValue>
            </ClusterRow>
          )}
        </Cluster>

        <Cluster style={{ marginTop: '16px' }}>
          <ClusterRow>
            <ClusterValue>
              <div className='approveTokenSpendAmountLabel'>{symbol}</div>
            </ClusterValue>
          </ClusterRow>
          <ClusterRow>
            <ClusterValue transparent={true} pointer={true}>
              <div className='approveTokenSpendAmount'>
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
                      updateCustomAmount(e.target.value, decimals)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
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
              </div>
            </ClusterValue>
          </ClusterRow>
          <ClusterRow>
            <ClusterValue transparent={true}>
              <div className='approveTokenSpendAmountSubtitle'>Set Token Approval Spend Limit</div>
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

export default EditTokenSpend
