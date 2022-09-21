import React from 'react'
import { utils } from 'ethers'

import link from '../../../../../../../resources/link'

const isNonZeroHex = (hex) => !!hex && !['0x', '0x0'].includes(hex)

function renderRecognizedAction (req, symbol) {
  const { recognizedActions: actions = [] } = req

  return actions.length > 0 && actions.map(action => {
    const { id, data } = action
    if (id === 'erc20:transfer') {
      return <SendOverview amountHex={data.amount} decimals={data.decimals} symbol={symbol} />
    } else if (id === 'ens:register') {
      return (
        <>
          <div className='_txDescriptionSummaryLine'>Registering ENS Name</div>
          <div className='_txDescriptionSummaryLine _txDescriptionSummaryHeadline'>{data.name}</div>
        </>
      )
    }
  })
}

const TxDescription = ({ chain, children }) => (
  <div className='_txDescriptionSummary'>
    {children}
    <div className='_txDescriptionSummaryLine'>{`on ${chain}`}</div>
  </div>
)

const SendOverview = ({ amountHex, decimals, symbol }) => {
  const displayAmount = utils.formatUnits(amountHex, decimals)

  return  (
    <div>{`Sending ${displayAmount} ${symbol}`}</div>
  )
}

const DeployContractOverview = () => (<div>Deploying Contract</div>)
const GenericContractOverview = ({ method }) => (<div>{`Calling Contract Method ${method}`}</div>)
const DataOverview = () => (<div>Sending data</div>)
const EmptyTransactionOverview = () => (<div>Empty Transaction</div>)

const TxOverview = ({ req, chainName, symbol, txMeta }) => {
  const { recipientType, decodedData: { method } = {}, data: tx = {} } = req
  const { to, value, data: calldata } = tx
  
  const isContractDeploy = !to && isNonZeroHex(calldata)
  const isSend = isNonZeroHex(value)
  const isContractCall = recipientType !== 'external'

  let description

  // TODO: empty vs unknown transactions

  console.log({ req, isContractCall, method })

  if (isContractDeploy) {
    description = <DeployContractOverview />
  } else if (isSend) {
    description = <SendOverview amountHex={value} decimals={18} symbol={symbol} />
  } else if (isContractCall) {
    description = renderRecognizedAction(req, symbol)

    if (!description && !!method) {
      description = <GenericContractOverview method={method} />
    }
  } else if (isNonZeroHex(calldata)) {
    description = <DataOverview />
  }

  return (
    <div className='_txMainValues'>
      <div className='_txMainValue _txMainValueClickable' onClick={() => {
        link.send('nav:update', 'panel', { data: { step: 'viewData' } })
      }}>
        <div className='_txDescription'>
          <TxDescription chain={chainName}>
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
