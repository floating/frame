import React, { useState } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import Balance from '../Balance'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
import HighValueWarning from '../Warning'
import BalancesList from '../BalancesList'

import useStore from '../../../../../resources/Hooks/useStore'

const BalancesExpanded = ({ getBalances, allChainsUpdated, isHotSigner }) => {
  const [balanceFilter, setBalanceFilter] = useState('')

  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const hiddenTokens = useStore('main.hiddenTokens') || []

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

  const { balances: allBalances, totalValue, totalDisplayValue } = getBalances(balanceFilter, hiddenTokens)

  const { balances: hiddenBalances } = getBalances(balanceFilter, hiddenTokens, true)

  return (
    <div className='accountViewScroll'>
      {renderAccountFilter()}
      <ClusterBox>
        <BalancesList balances={allBalances} />
      </ClusterBox>
      <div className='signerBalanceTotal'>
        <div className='signerBalanceButtons'>
          <div
            className='signerBalanceButton signerBalanceAddToken'
            onMouseDown={() => {
              link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken' } })
            }}
          >
            <span>Add Token</span>
          </div>
        </div>
        {allBalances.length && allChainsUpdated ? (
          <div className='signerBalanceTotalText'>
            <div className='signerBalanceTotalLabel'>{'Total'}</div>
            <div className='signerBalanceTotalValue'>
              {svg.usd(11)}
              {totalDisplayValue}
            </div>
          </div>
        ) : (
          <div className='signerBalanceLoading'>{svg.sine()}</div>
        )}
      </div>
      {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={allChainsUpdated} />}

      <ClusterBox>
        <Cluster>
          <ClusterRow>
            <ClusterValue onClick={() => setShowHiddenTokens(!showHiddenTokens)}>
              <div className='showHiddenTokens'>
                {svg.hide(18)}
                <span>{showHiddenTokens ? 'hide  hidden balances' : 'show  hidden balances'}</span>
              </div>
            </ClusterValue>
          </ClusterRow>
        </Cluster>
      </ClusterBox>
      {showHiddenTokens && (
        <ClusterBox>
          <BalancesList balances={hiddenBalances} />
        </ClusterBox>
      )}
    </div>
  )
}

export default BalancesExpanded
