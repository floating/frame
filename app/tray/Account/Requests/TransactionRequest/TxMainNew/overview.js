import React from 'react'

import link from '../../../../../../resources/link'
import EnsOverview from '../../Ens'

import svg from '../../../../../../resources/svg'
import { isNonZeroHex } from '../../../../../../resources/utils'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../../resources/Components/Cluster'
import { DisplayValue } from '../../../../../../resources/Components/DisplayValue'
import RequestHeader from '../../../../../../resources/Components/RequestHeader'

const SimpleContractCallOverview = ({ method }) => {
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

const SendOverview = ({ req, symbol, decimals, amount: ammt }) => {
  const amount = ammt || req.data.value
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

const ContractCallOverview = ({ req }) => {
  const { decodedData: { method } = {} } = req
  return renderRecognizedActions(req) || <SimpleContractCallOverview method={method} />
}

const actionOverviews = {
  'erc20:transfer': SendOverview,
  'erc20:approve': ApproveOverview,
  ens: EnsOverview
}

const renderActionOverview = (action, index) => {
  const { id = '', data } = action
  const key = id + index
  const [actionClass, actionType] = id.split(':')
  const ActionOverview = actionOverviews[id] || SimpleContractCallOverview

  return <ActionOverview key={key} type={actionType} {...{ ...data }} />
}

function renderRecognizedActions(req) {
  const { recognizedActions: actions = [] } = req

  return !actions.length ? (
    <div className='_txDescriptionSummaryLine'>Calling Contract</div>
  ) : (
    actions.map(renderActionOverview)
  )
}

const BaseOverviews = {
  CONTRACT_DEPLOY: DeployContractOverview,
  CONTRACT_CALL: ContractCallOverview,
  SEND_DATA: DataOverview,
  NATIVE_TRANSFER: SendOverview
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
  const { data: tx = {}, classification } = req
  const { data: calldata } = tx

  const Description = BaseOverviews[classification]

  if (simple) {
    return (
      <div className='txDescriptionSummaryStandalone'>
        <span className='txDescriptionSummaryStandaloneWrap'>
          <Description req={req} decimals={18} symbol={symbol} />
        </span>
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
                <div className='_txDescriptionSummaryMain'>
                  <Description req={req} decimals={18} symbol={symbol} />
                </div>
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
