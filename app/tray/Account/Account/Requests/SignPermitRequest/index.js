import React, { useState, useEffect } from 'react'
import { formatDisplayInteger, isUnlimited } from '../../../../../../resources/utils/numbers'
import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../../resources/Components/Cluster'
import Countdown from '../../../../../../resources/Components/Countdown'
import ChainHeader from '../../../../../../resources/Components/RequestChainHeader'
import RequestItem from '../../../../../../resources/Components/RequestItem'

import TokenSpend from '../TransactionRequest/TokenSpend'
import DefaultSignature from '../SignTypedDataRequest/Default'

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

const PermitSignature = ({ req, originName, step, chainName, chainColor, icon }) => {
  const [tokenData, setTokenData] = useState(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    link.rpc('getErc20Data', verifyingContract, chainId, (err, tokenData) => {
      //TODO: handle error state here
      if (err) return console.error(err)
      setTokenData(tokenData)
    })
  }, [])

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
    const [customValue, setCustomValue] = useState('')
    const [mode, setMode] = useState('requested')

    return (
      <div className='signTypedData'>
        <div className='signTypedDataInner'>
          <ClusterBox title={'Edit Token Spend Permit'} style={{ marginTop: '64px' }}>
            <Cluster>
              <ClusterRow>
                <ClusterValue
                  pointerEvents={'auto'}
                  onClick={() => {
                    // this.copySpenderAddress(spender)
                  }}
                >
                  <div className='clusterAddress'>
                    <span className='clusterAddressRecipient'>
                      {spender.substring(0, 8)}
                      {svg.octicon('kebab-horizontal', { height: 15 })}
                      {spender.substring(spender.length - 6)}
                    </span>
                    <div className='clusterAddressRecipientFull'>
                      {/* {this.state.copiedSpenderAddress ? (
                      <span>{'Address Copied'}</span>
                    ) : ( */}
                      <span className='clusterFira'>{spender}</span>
                      {/* )} */}
                    </div>
                  </div>
                </ClusterValue>
              </ClusterRow>

              <ClusterRow>
                <ClusterValue>
                  <div className='clusterTag' style={{ color: 'var(--moon)' }}>
                    <span>{'grant approval to spend'}</span>
                  </div>
                </ClusterValue>
              </ClusterRow>

              <ClusterRow>
                <ClusterValue
                  pointerEvents={'auto'}
                  onClick={() => {
                    link.rpc(
                      'updateTypedSignatureRequest',
                      req.id,
                      {
                        ...req.typedMessage.data,
                        value: 100
                      },
                      () => {}
                    )
                  }}
                >
                  <div className='clusterAddress'>
                    <span className='clusterAddressRecipient'>{name}</span>
                    <div className='clusterAddressRecipientFull'>
                      {/* {this.state.copiedTokenAddress ? ( */}
                      {/* <span>{'Address Copied'}</span> */}
                      {/* ) : ( */}
                      <span className='clusterFira'>{verifyingContract}</span>
                      {/* )} */}
                    </div>
                  </div>
                </ClusterValue>
              </ClusterRow>
            </Cluster>
          </ClusterBox>
        </div>
      </div>
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

import React from 'react'
import Restore from 'react-restore'
import DefaultSignature from '../SignTypedDataRequest/Default'
import { data } from 'cheerio/lib/api/attributes'

const getRequestClass = ({ status = '' }) =>
  `signerRequest ${status.charAt(0).toUpperCase() + status.slice(1)}`

class TransactionRequest extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = { allowInput: false, dataView: false }

    const props = args[0] || {}

    setTimeout(() => {
      this.setState({ allowInput: true })
    }, props.signingDelay || 1500)
  }

  render() {
    const { req } = this.props
    const requestClass = getRequestClass(req)
    const originName = this.store('main.origins', req.origin, 'name')
    const chainId = req.typedMessage.data.domain.chainId
    const chainName = this.store('main.networks.ethereum', chainId, 'name')
    const { primaryColor, icon } = this.store('main.networksMeta.ethereum', chainId)

    return (
      <div key={req.id || req.handlerId} className={requestClass}>
        <PermitSignature {...{ originName, chainName, chainColor: primaryColor, icon, ...this.props }} />
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
