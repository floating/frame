import React, { useState, useEffect } from 'react'
import { formatDisplayInteger, isUnlimited } from '../../../../../../../resources/utils/numbers'
import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'
import {
  ClusterBox,
  Cluster,
  ClusterRow,
  ClusterValue
} from '../../../../../../../resources/Components/Cluster'
import Countdown from '../../../../../../../resources/Components/Countdown'
import ChainHeader from '../../../../../../../resources/Components/RequestChainHeader'
import RequestItem from '../../../../../../../resources/Components/RequestItem'

import DefaultSignature from '../Default'

// class TokenPermit extends React.Component {
//   constructor(...args) {
//     super(...args)
//     this.state = {
//       inPreview: false,
//       inEditApproval: false,
//       mode: 'requested',
//       customInput: ''
//     }
//   }

//   setAmount(amount) {
//     this.setState({ amount })
//   }

//   setCustomAmount(value, decimals) {
//     if (value === '') {
//       this.setState({ mode: 'custom', amount: '0x0', customInput: value })
//     } else {
//       // only allow ints
//       if (!/^\d+$/.test(value)) return

//       const max = new BigNumber(MAX_HEX)
//       const custom = new BigNumber(value).shiftedBy(decimals)

//       let amount
//       if (max.comparedTo(custom) === -1) {
//         amount = MAX_HEX
//       } else {
//         amount = '0x' + custom.integerValue().toString(16)
//       }

//       this.setState({ mode: 'custom', amount, customInput: value })
//     }
//   }

//   startEditing() {
//     this.setState({ inEditApproval: true })
//   }

//   copySpenderAddress(data) {
//     link.send('tray:clipboardData', data)
//     this.setState({ copiedSpenderAddress: true })
//     setTimeout(() => this.setState({ copiedSpenderAddress: false }), 1000)
//   }

//   copyTokenAddress(data) {
//     link.send('tray:clipboardData', data)
//     this.setState({ copiedTokenAddress: true })
//     setTimeout(() => this.setState({ copiedTokenAddress: false }), 1000)
//   }

//   render() {
//     const { req, updateApproval, tokenData } = this.props

//     const {
//       typedMessage: {
//         data: {
//           message: { deadline, spender, value: requestedAmount },
//           domain: { verifyingContract, chainId }
//         }
//       }
//     } = req

//     const { name, decimals, symbol } = tokenData ||

//     const customInput =
//       '0x' + new BigNumber(this.state.customInput).shiftedBy(decimals).integerValue().toString(16)
//     const value = new BigNumber(amount)
//     const revoke = value.eq(0)

//     const displayAmount = isUnlimited(data.amount) ? 'unlimited' : formatDisplayInteger(data.amount, decimals)

//     const inputLock = !name || !symbol || !decimals

//     const tokenAddress = verifyingContrac
//   }
// }

export default PermitSignature = ({ req, originName, step, chainName, chainColor, icon }) => {
  const [tokenData, setTokenData] = useState(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    link.rpc('getErc20Data', verifyingContract, chainId, (err, tokenData) => {
      //TODO: handle error state here
      if (err) return console.error(err)
      setTokenData(tokenData)
    })
  }, [req.typedMessage])

  const {
    typedMessage: {
      data: {
        message: { deadline, spender, value, owner },
        domain: { verifyingContract, chainId, name }
      }
    }
  } = req

  const copyAddress = (data) => {
    link.send('tray:clipboardData', data)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  const Overview = () => {
    //TODO: allow time limit & value to be edited...
    return (
      <div className='approveRequest'>
        <div className='approveTransactionPayload'>
          {/* //TODO: loading state when getting token data */}
          {/* <div className='signTypedDataSection'>
          </div> */}
          <RequestItem
            key={req.type}
            req={req}
            account={owner}
            handlerId={req.handlerId}
            i={0}
            title={`ERC20 Permit Signature`}
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

                  {tokenData && (
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
                                : formatDisplayInteger(value, tokenData?.decimals)
                            } ${tokenData.symbol}`}</div>
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
                            {/* {ensName ? (
                          <span className='clusterAddressRecipient'>{ensName}</span>
                        ) : ( */}
                            <div style={{ textAlign: 'center' }}>{`TO`}</div>
                            <span className='clusterAddressRecipient'>
                              {spender.substring(0, 8)}
                              {svg.octicon('kebab-horizontal', { height: 15 })}
                              {spender.substring(spender.length - 6)}
                            </span>
                            {/* )} */}
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

                      <Countdown
                        end={deadline * 1000}
                        handleClick={() => {}}
                        title={'Permission Expires in'}
                      />
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

  const Edit = () => {
    return (
      // <div className='signTypedData'>
      //   <div className='signTypedDataInner'>
      //     <ClusterBox title={'  '} style={{ marginTop: '64px' }}>
      //       <Cluster>
      //         <ClusterRow>
      //           <ClusterValue
      //             pointerEvents={'auto'}
      //             onClick={() => {
      //               this.copySpenderAddress(spender)
      //             }}
      //           >
      //             <div className='clusterAddress'>
      //               {/* {spenderEns ? (
      //               <span className='clusterAddressRecipient'>{spenderEns}</span>
      //             ) : ( */}
      //               <span className='clusterAddressRecipient'>
      //                 {spender.substring(0, 8)}
      //                 {svg.octicon('kebab-horizontal', { height: 15 })}
      //                 {spender.substring(spender.length - 6)}
      //               </span>
      //               {/* )} */}
      //               <div className='clusterAddressRecipientFull'>
      //                 {copied ? (
      //                   <span>{'Address Copied'}</span>
      //                 ) : (
      //                   <span className='clusterFira'>{spender}</span>
      //                 )}
      //               </div>
      //             </div>
      //           </ClusterValue>
      //         </ClusterRow>
      //         <ClusterRow>
      //           <ClusterValue>
      //             <div className='clusterTag' style={{ color: 'var(--moon)' }}>
      //               {this.state.mode === 'custom' && !this.state.customInput ? (
      //                 <span>{'set approval to spend'}</span>
      //               ) : revoke ? (
      //                 <span>{'revoke approval to spend'}</span>
      //               ) : (
      //                 <span>{'grant approval to spend'}</span>
      //               )}
      //             </div>
      //           </ClusterValue>
      //         </ClusterRow>
      //         <ClusterRow>
      //           <ClusterValue
      //             pointerEvents={'auto'}
      //             onClick={() => {
      //               this.copyTokenAddress(tokenAddress)
      //             }}
      //           >
      //             <div className='clusterAddress'>
      //               <span className='clusterAddressRecipient'>{name}</span>
      //               <div className='clusterAddressRecipientFull'>
      //                 {this.state.copiedTokenAddress ? (
      //                   <span>{'Address Copied'}</span>
      //                 ) : (
      //                   <span className='clusterFira'>{tokenAddress}</span>
      //                 )}
      //               </div>
      //             </div>
      //           </ClusterValue>
      //         </ClusterRow>
      //       </Cluster>
      //       <Cluster style={{ marginTop: '16px' }}>
      //         <ClusterRow>
      //           <ClusterValue transparent={true} pointerEvents={'auto'}>
      //             <div className='approveTokenSpendAmount'>
      //               <div className='approveTokenSpendAmountLabel'>{symbol}</div>
      //               {this.state.mode === 'custom' && data.amount !== customInput ? (
      //                 <div
      //                   className='approveTokenSpendAmountSubmit'
      //                   role='button'
      //                   onClick={() => {
      //                     if (this.state.customInput === '') {
      //                       this.setState({ mode: 'requested', amount: requestedAmount })
      //                       updateApproval(requestedAmount)
      //                     } else {
      //                       updateApproval(this.state.amount)
      //                     }
      //                   }}
      //                 >
      //                   {'update'}
      //                 </div>
      //               ) : (
      //                 <div
      //                   key={this.state.mode + data.amount}
      //                   className='approveTokenSpendAmountSubmit'
      //                   style={{ color: 'var(--good)' }}
      //                 >
      //                   {svg.check(20)}
      //                 </div>
      //               )}
      //               {this.state.mode === 'custom' ? (
      //                 <input
      //                   autoFocus
      //                   type='text'
      //                   aria-label='Custom Amount'
      //                   value={this.state.customInput}
      //                   onChange={(e) => {
      //                     e.preventDefault()
      //                     e.stopPropagation()
      //                     this.setCustomAmount(e.target.value, decimals)
      //                   }}
      //                   onKeyDown={(e) => {
      //                     if (e.key === 'Enter') {
      //                       e.target.blur()
      //                       if (this.state.customInput === '') {
      //                         this.setState({ mode: 'requested', amount: requestedAmount })
      //                         updateApproval(requestedAmount)
      //                       } else {
      //                         updateApproval(this.state.amount)
      //                       }
      //                     }
      //                   }}
      //                 />
      //               ) : (
      //                 <div
      //                   className='approveTokenSpendAmountNoInput'
      //                   role='textbox'
      //                   style={inputLock ? { cursor: 'default' } : null}
      //                   onClick={
      //                     inputLock
      //                       ? null
      //                       : () => {
      //                           this.setCustomAmount(this.state.customInput, decimals)
      //                         }
      //                   }
      //                 >
      //                   {displayAmount}
      //                 </div>
      //               )}
      //               <div className='approveTokenSpendAmountSubtitle'>Set Token Approval Spend Limit</div>
      //             </div>
      //           </ClusterValue>
      //         </ClusterRow>
      //         <ClusterRow>
      //           <ClusterValue
      //             onClick={() => {
      //               this.setState({ mode: 'requested', amount: requestedAmount })
      //               updateApproval(requestedAmount)
      //             }}
      //           >
      //             <div
      //               className='clusterTag'
      //               style={this.state.mode === 'requested' ? { color: 'var(--good)' } : {}}
      //               role='button'
      //             >
      //               {'Requested'}
      //             </div>
      //           </ClusterValue>
      //         </ClusterRow>
      //         <ClusterRow>
      //           <ClusterValue
      //             onClick={() => {
      //               const amount = MAX_HEX
      //               this.setState({ mode: 'unlimited', amount })
      //               updateApproval(amount)
      //             }}
      //           >
      //             <div
      //               className='clusterTag'
      //               style={this.state.mode === 'unlimited' ? { color: 'var(--good)' } : {}}
      //               role='button'
      //             >
      //               {'Unlimited'}
      //             </div>
      //           </ClusterValue>
      //         </ClusterRow>
      //         {!inputLock && (
      //           <ClusterRow>
      //             <ClusterValue
      //               onClick={() => {
      //                 this.setCustomAmount(this.state.customInput, decimals)
      //               }}
      //             >
      //               <div
      //                 className={'clusterTag'}
      //                 style={this.state.mode === 'custom' ? { color: 'var(--good)' } : {}}
      //                 role='button'
      //               >
      //                 Custom
      //               </div>
      //             </ClusterValue>
      //           </ClusterRow>
      //         )}
      //       </Cluster>
      //     </ClusterBox>
      //   </div>
      // </div>
      <div></div>
    )
  }

  switch (step) {
    case 'adjustPermit':
      return <Edit />
    case 'viewRaw':
      return <DefaultSignature {...{ originName, req }} />
    default:
      return <Overview />
  }
}
