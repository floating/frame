import React from 'react'

import link from '../../../../../../resources/link'
import EnsOverview from '../../Ens'

import svg from '../../../../../../resources/svg'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../../resources/Components/Cluster'
import { DisplayValue } from '../../../../../../resources/Components/DisplayValue'
import RequestHeader from '../../../../../../resources/Components/RequestHeader'

const isNonZeroHex = (hex) => !!hex && !['0x', '0x0'].includes(hex)

const ContractCallOverview = ({ method }) => {
  const body = method ? `Calling Contract Method ${method}` : 'Calling Contract'

  return <div className='_txDescriptionSummaryLine'>{body}</div>
}

const ApproveOverview = ({ amount, decimals, symbol }) => {
  return (
    <div>
      <span>{'Approve Spending '}</span>
      <DisplayValue
        type='ether'
        value={amount}
        valueDataParams={{ decimals }}
        currencySymbol={symbol}
        currencySymbolPosition='last'
      />
    </div>
  )
}

const SendOverview = ({ amount, decimals, symbol }) => {
  return (
    <div>
      <span>{'Send'}</span>
      <DisplayValue
        type='ether'
        value={amount}
        valueDataParams={{ decimals }}
        currencySymbol={symbol}
        currencySymbolPosition='last'
      />
    </div>
  )
}

const DeployContractOverview = () => <div>Deploying Contract</div>
const DataOverview = () => <div>Sending data</div>

const actionOverviews = {
  'erc20:transfer': SendOverview,
  'erc20:approve': ApproveOverview,
  ens: EnsOverview
}

const renderActionOverview = (action, index) => {
  const { id = '', data } = action
  const key = id + index
  const [, actionType] = id.split(':')
  const ActionOverview = actionOverviews[id] || ContractCallOverview

  return <ActionOverview key={key} type={actionType} {...{ ...data }} />
}

function renderRecognizedAction(req) {
  const { recognizedActions: actions = [] } = req

  return !actions.length ? (
    <div className='_txDescriptionSummaryLine'>Calling Contract</div>
  ) : (
    actions.map(renderActionOverview)
  )
}

const TxOverview = ({
  req,
  chainName,
  chainColor,
  symbol,
  originName,
  replacementStatus,
  simple,
  valueColor
}) => {
  const { recipientType, decodedData: { method } = {}, data: tx = {} } = req
  const { to, value, data: calldata } = tx

  const isContractDeploy = !to && isNonZeroHex(calldata)
  const isSend = isNonZeroHex(value)
  const isContractCall = recipientType !== 'external'

  let description

  // TODO: empty vs unknown transactions

  if (isContractDeploy) {
    description = <DeployContractOverview />
  } else if (isContractCall) {
    description = renderRecognizedAction(req)

    if (!description && !!method) {
      description = <ContractCallOverview method={method} />
    }
  } else if (isSend) {
    description = <SendOverview amountHex={value} decimals={18} symbol={symbol} />
  } else if (isNonZeroHex(calldata)) {
    description = <DataOverview />
  }
  if (simple) {
    return (
      <div className='txDescriptionSummaryStandalone'>
        <span className='txDescriptionSummaryStandaloneWrap'>{description}</span>
      </div>
    )
  } else {
    return (
      <Cluster>
        <ClusterRow>
          <ClusterValue
            onClick={() => {
              link.send('nav:update', 'panel', { data: { step: 'viewData' } })
            }}
            style={{ background: valueColor }}
          >
            <div className='_txDescription'>
              <RequestHeader chain={chainName} chainColor={chainColor}>
                <div className='requestItemTitleSub'>
                  <div className='requestItemTitleSubIcon'>{svg.window(10)}</div>
                  <div className='requestItemTitleSubText'>{originName}</div>
                </div>
                <div className='_txDescriptionSummaryMain'>{description}</div>
              </RequestHeader>
            </div>
          </ClusterValue>
        </ClusterRow>
        {replacementStatus.replacement &&
          (replacementStatus.possible ? (
            <ClusterRow>
              <ClusterValue>
                <div className='_txMainTag _txMainTagGood'>valid replacement</div>
              </ClusterValue>
            </ClusterRow>
          ) : (
            <ClusterRow>
              <ClusterValue>
                <div className='_txMainTag _txMainTagBad'>
                  {replacementStatus.notice || 'invalid duplicate'}
                </div>
              </ClusterValue>
            </ClusterRow>
          ))}
        {isNonZeroHex(calldata) && (
          <ClusterRow>
            <ClusterValue>
              <div className='_txMainTag _txMainTagWarning'>{'Transaction includes data'}</div>
            </ClusterValue>
          </ClusterRow>
        )}
      </Cluster>
    )
  }
}

export default TxOverview
