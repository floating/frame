import React from 'react'

import link from '../../../../../../../resources/link'
import EnsOverview from '../../Ens'
import { displayValueData } from '../../../../../../../resources/domain/transaction/displayValue'

const isNonZeroHex = (hex) => !!hex && !['0x', '0x0'].includes(hex)

function renderRecognizedAction (req) {
  const { recognizedActions: actions = [] } = req

  return actions.length > 0 && actions.map(action => {
    const { id = '', data } = action

    const [actionClass, actionType] = id.split(':')

    if (actionClass === 'erc20') {
      if (actionType === 'transfer') {
        return <SendOverview amountHex={data.amount} decimals={data.decimals} symbol={data.symbol} />
      }
    } else if (actionClass === 'ens') {
      return <EnsOverview type={actionType} data={data} />
    }
  })
}

const TxDescription = ({ chain, children, chainColor }) => (
  <div className='_txDescriptionSummary'>
    {children}
    <div className='_txDescriptionSummaryTag' style={{ color: `var(--${chainColor})` }}>{`on ${chain}`}</div>
  </div>
)

const SendOverview = ({ amountHex, decimals, symbol }) => {
  const { ether } = displayValueData(amountHex, { decimals })

  return  (
    <div>{`Send ${ether.displayValue}${ether.displayUnit ? ether.displayUnit.shortName : ''} ${symbol}`}</div>
  )
}

const DeployContractOverview = () => (<div>Deploying Contract</div>)
const GenericContractOverview = ({ method }) => (<div>{`Calling Contract Method ${method}`}</div>)
const DataOverview = () => (<div>Sending data</div>)
const EmptyTransactionOverview = () => (<div>Empty Transaction</div>)

const TxOverview = ({ req, chainName, chainColor, symbol, txMeta, simple }) => {
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
      description = <GenericContractOverview method={method} />
    }
  } else if (isSend) {
    description = <SendOverview amountHex={value} decimals={18} symbol={symbol} />
  } else if (isNonZeroHex(calldata)) {
    description = <DataOverview />
  }

  if (simple) return description || <EmptyTransactionOverview />

  return (
    <div className='_txMainValues'>
      <div className='_txMainValue _txMainValueClickable' onClick={() => {
        link.send('nav:update', 'panel', { data: { step: 'viewData' } })
      }}>
        <div className='_txDescription'>
          <TxDescription chain={chainName} chainColor={chainColor}>
            {description || <EmptyTransactionOverview />}
          </TxDescription>
        </div>
      </div>
      {txMeta.replacement ? (
        txMeta.possible ? (
          <div className='_txMainTag _txMainTagWarning'>
            valid replacement
          </div>
        ) : (
          <div className='_txMainTag _txMainTagWarning'>
            {txMeta.notice || 'invalid duplicate'}
          </div>
        )
      ) : null}
      {isNonZeroHex(calldata) ? (
        <div className='_txMainTag _txMainTagWarning'>
          {'Transaction includes data'}
        </div>
      ) : null}
    </div>
  )
      }


export default TxOverview
