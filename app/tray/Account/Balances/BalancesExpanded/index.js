import React, { useState } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import Balance from '../Balance'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
import HighValueWarning from '../Warning'
import BalancesList from '../BalancesList'

import useStore from '../../../../../resources/Hooks/useStore'

const BalancesExpanded = ({
  getBalances,
  allChainsUpdated,
  isHotSigner,
  expandedData,
  moduleId,
  account
}) => {
  const [balanceFilter, setBalanceFilter] = useState('')

  const tokenPreferences = useStore('main.assetPreferences.tokens') || {}

  const renderAccountFilter = () => {
    return (
      <div className='panelFilterAccount'>
        <div className='panelFilterIcon'>{svg.search(12)}</div>
        <div className='panelFilterInput'>
          <input
            tabIndex='-1'
            type='text'
            spellCheck='false'
            onChange={(e) => {
              const value = e.target.value
              setBalanceFilter(value)
            }}
            value={balanceFilter}
          />
        </div>
        {balanceFilter ? (
          <div className='panelFilterClear' onClick={() => setBalanceFilter('')}>
            {svg.close(12)}
          </div>
        ) : null}
      </div>
    )
  }

  const {
    balances: allBalances,
    totalValue,
    totalDisplayValue
  } = getBalances(balanceFilter, tokenPreferences)

  const { balances: hiddenBalances, totalDisplayValue: hiddenTotalDisplayValue } = getBalances(
    balanceFilter,
    tokenPreferences,
    true
  )

  return (
    <div className='accountViewScroll'>
      {renderAccountFilter()}
      <ClusterBox>
        <BalancesList balances={expandedData.hidden ? hiddenBalances : allBalances} />
        <div className='signerBalanceTotal'>
          {!expandedData.hidden && (
            <div className='signerBalanceButtons'>
              <div
                className='signerBalanceButton signerBalanceShowAll'
                onClick={() => {
                  const crumb = {
                    view: 'expandedModule',
                    data: {
                      id: moduleId,
                      title: 'Hidden Balances',
                      account: account,
                      hidden: true
                    }
                  }
                  link.send('nav:forward', 'panel', crumb)
                }}
              >
                {`+${hiddenBalances.length} Hidden`}
              </div>
            </div>
          )}
          {hiddenBalances.length ? (
            <div className='signerBalanceTotalText'>
              <div className='signerBalanceTotalLabel'>{'Total'}</div>
              <div className='signerBalanceTotalValue'>
                {svg.usd(11)}
                {expandedData.hidden ? hiddenTotalDisplayValue : totalDisplayValue}
              </div>
            </div>
          ) : (
            <div className='signerBalanceLoading'>{svg.sine()}</div>
          )}
        </div>
      </ClusterBox>
      <div className='signerBalanceFooter'>
        <div
          className='signerBalanceButton signerBalanceAddToken'
          onMouseDown={() => {
            link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken' } })
          }}
        >
          <span>Add Token</span>
        </div>
      </div>
      {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={allChainsUpdated} />}
    </div>
  )
}

export default BalancesExpanded
