import React, { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'

import { formatDisplayInteger, isUnlimited } from '../../../../../../resources/utils/numbers'
import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../../resources/Components/Cluster'
import Countdown from '../../../../../../resources/Components/Countdown'
import RequestHeader from '../../../../../../resources/Components/RequestHeader'
import RequestItem from '../../../../../../resources/Components/RequestItem'
import CustomAmountInput from '../../../../../../resources/Components/CustomAmountInput'
import TypedSignatureOverview from '../../../../../../resources/Components/SimpleTypedData'
import useCopiedMessage from '../../../../../../resources/Hooks/useCopiedMessage'

import { getSignatureRequestClass } from '../../../../../../resources/domain/request'
const getPermit = (req) => {
  const {
    typedMessage: {
      data: {
        message: { deadline, spender, value, owner, nonce },
        domain: { verifyingContract, chainId, name, version },
        types
      }
    }
  } = req

  return {
    deadline,
    spender,
    value,
    owner,
    verifyingContract,
    chainId,
    name,
    nonce,
    version,
    types
  }
}

const PermitOverview = ({ permit, req, chainData, originName, tokenData }) => {
  const { owner, deadline, spender, value } = permit
  const { chainColor, chainName, icon } = chainData
  const [showCopiedMessage, copySpender] = useCopiedMessage(spender)

  //TODO: allow time limit & value to be edited...
  return (
    <div className='approveRequest'>
      <div className='approveTransactionPayload'>
        {/* //TODO: loading state when getting token data */}
        <RequestItem
          key={`signErc20Permit:${req.handlerId}`}
          req={req}
          account={owner}
          handlerId={req.handlerId}
          i={0}
          title={`Token Spend Permit`}
          color={chainColor ? `var(--${chainColor})` : ''}
          img={icon}
          headerMode={true}
        >
          <div>
            <ClusterBox animationSlot={1}>
              <Cluster>
                <ClusterRow>
                  <ClusterValue>
                    <div className='_txDescription'>
                      <RequestHeader chain={chainName} chainColor={chainColor}>
                        <div className='requestItemTitleSub'>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>{originName}</div>
                        </div>
                      </RequestHeader>
                    </div>
                  </ClusterValue>
                </ClusterRow>

                {tokenData.decimals && (
                  <>
                    <ClusterRow>
                      <ClusterValue
                        onClick={() => {
                          link.send('nav:update', 'panel', {
                            data: {
                              step: 'adjustPermit',
                              tokenData
                            }
                          })
                        }}
                      >
                        <div className='clusterFocus'>
                          <div>{`Granting Permission To Spend`}</div>
                          <div className='clusterFocusHighlight'>{`${
                            isUnlimited(value)
                              ? '~UNLIMITED'
                              : formatDisplayInteger(value, tokenData.decimals)
                          } ${tokenData.symbol || '??'}`}</div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>

                    <ClusterRow>
                      <ClusterValue
                        pointerEvents={true}
                        onClick={() => {
                          copySpender(spender)
                        }}
                      >
                        <div className='clusterAddress'>
                          <div style={{ textAlign: 'center' }}>{`TO`}</div>
                          <span className='clusterAddressRecipient'>
                            {spender.substring(0, 8)}
                            {svg.octicon('kebab-horizontal', { height: 15 })}
                            {spender.substring(spender.length - 6)}
                          </span>
                          <div className='clusterAddressRecipientFull'>
                            {showCopiedMessage ? (
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
                        <Countdown
                          end={deadline * 1000}
                          title={'Permission Expires in'}
                          innerClass='clusterFocusHighlight'
                          titleClass='clusterFocus'
                        />
                      </ClusterValue>
                    </ClusterRow>
                  </>
                )}

                <ClusterRow>
                  <ClusterValue
                    onClick={() => {
                      link.send('nav:update', 'panel', {
                        data: { step: 'viewRaw' }
                      })
                    }}
                  >
                    <div className='_txMainTag _txMainTagWarning'>{'View Raw Signature Data'}</div>
                  </ClusterValue>
                </ClusterRow>
              </Cluster>
            </ClusterBox>
          </div>
        </RequestItem>
      </div>
    </div>
  )
}

const EditPermit = ({ permit, tokenData, req }) => {
  const {
    verifyingContract: contract,
    spender,
    value: amount,
    deadline: deadlineInSeconds,
    chainId,
    nonce,
    name,
    types,
    owner,
    version
  } = permit

  const updateRequest = (newAmt) => {
    console.log({ newAmt })
    link.rpc(
      'updateTypedSignatureRequest',
      req.handlerId,
      {
        message: { deadline: deadlineInSeconds, spender, value: newAmt, owner, nonce },
        domain: { verifyingContract: contract, chainId, name, version },
        types,
        primaryType: 'Permit'
      },
      () => {}
    )
  }
  const deadline = deadlineInSeconds * 1000

  const requestedAmount = new BigNumber(req.payload.params[1].message.value).toString()

  const data = {
    ...tokenData,
    contract,
    spender,
    amount
  }

  return (
    <CustomAmountInput
      {...{
        data,
        requestedAmount,
        updateRequest,
        deadline
      }}
    />
  )
}

const PermitRequest = ({ req, originName, step, chainData }) => {
  const [tokenData, setTokenData] = useState({})
  const permit = getPermit(req)
  useEffect(() => {
    link.rpc('getErc20Data', permit.verifyingContract, permit.chainId, (err, tokenData) => {
      //TODO: handle error state here
      if (err) return console.error(err)
      setTokenData(tokenData)
    })
  }, [])

  const requestClass = getSignatureRequestClass(req)

  //TODO: Expand existing cluster, and allow token address to be copied there - dont need a second screen
  const renderStep = () => {
    switch (step) {
      case 'adjustPermit':
        return (
          <EditPermit
            {...{
              tokenData,
              permit,
              req
            }}
          />
        )
      case 'viewRaw':
        return <TypedSignatureOverview {...{ originName, req }} />
      default:
        return (
          <PermitOverview
            {...{
              originName,
              tokenData,
              permit,
              req,
              chainData
            }}
          />
        )
    }
  }

  return (
    <div key={req.id || req.handlerId} className={requestClass}>
      {renderStep()}
    </div>
  )
}

export default PermitRequest
