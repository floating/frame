import React, { useState, useEffect } from 'react'
import BigNumber from 'bignumber.js'
import DefaultSignature from '../SignTypedDataRequest/Default'
import { formatDisplayInteger, isUnlimited } from '../../../../../../resources/utils/numbers'
import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../../resources/Components/Cluster'
import Countdown from '../../../../../../resources/Components/Countdown'
import ChainHeader from '../../../../../../resources/Components/RequestChainHeader'
import RequestItem from '../../../../../../resources/Components/RequestItem'
import CustomAmountInput from '../../../../../../resources/Components/CustomAmountInput'

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
  const [copied, setCopied] = useState(false)
  const copyAddress = (data) => {
    link.send('tray:clipboardData', data)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

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
                  <ClusterValue
                    onClick={() => {
                      link.send('nav:update', 'panel', { data: { step: 'viewData' } })
                    }}
                  >
                    <div className='_txDescription'>
                      <ChainHeader chain={chainName} chainColor={chainColor}>
                        <div className='requestItemTitleSub'>
                          <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                          <div className='requestItemTitleSubText'>{originName}</div>
                        </div>
                      </ChainHeader>
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
                          copyAddress(spender)
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
                            {copied ? (
                              <span>{'Address Copied'}</span>
                            ) : (
                              <span className='clusterFira'>{spender}</span>
                            )}
                          </div>
                        </div>
                      </ClusterValue>
                    </ClusterRow>

                    <Countdown end={deadline * 1000} handleClick={() => {}} title={'Permission Expires in'} />
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

const PermitSignature = ({ req, originName, step, chainData }) => {
  const [tokenData, setTokenData] = useState({})
  const permit = getPermit(req)
  console.log({ permit })
  useEffect(() => {
    link.rpc('getErc20Data', permit.verifyingContract, chainData.chainId, (err, tokenData) => {
      //TODO: handle error state here
      if (err) return console.error(err)
      console.log({ tokenData })
      setTokenData(tokenData)
    })
  }, [])

  const requestClass = getRequestClass(req)

  //TODO: Expand existing cluster, and allow token address to be copied there - dont need a second screen
  const requestedAmount = new BigNumber(req.payload.params[1].message.value).toString()
  // const Edit = () =>
  //   tokenData && (
  //     <CustomAmountInput
  //       data={{
  //         ...tokenData,
  //         contract: verifyingContract,
  //         spender,
  //         amount: value
  //       }}
  //       requestedAmount={requestedAmount}
  //       //TODO: Hook up this to the function which updates the sign typed data request...
  //       updateRequest={(newAmt) => {
  //         console.log('updating ammount to', { newAmmount: newAmt })
  //         link.rpc(
  //           'updateTypedSignatureRequest',
  //           req.handlerId,
  //           {
  //             message: { deadline, spender, value: newAmt, owner, nonce },
  //             domain: { verifyingContract, chainId, name, version },
  //             types,
  //             primaryType: 'Permit'
  //           },
  //           () => {}
  //         )
  //       }}
  //       deadline={deadline * 1000}
  //     />
  //   )
  const renderStep = () => {
    switch (step) {
      // case 'adjustPermit':
      //   return <Edit />
      // case 'viewRaw':
      //   return <DefaultSignature {...{ originName, req }} />
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

const getRequestClass = ({ status = '' }) =>
  `signerRequest ${status.charAt(0).toUpperCase() + status.slice(1)}`

export default PermitSignature
