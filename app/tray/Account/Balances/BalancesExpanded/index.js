import React, { useState } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import HighValueWarning from '../Warning'
import BalancesList from '../BalancesList'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import useStore from '../../../../../resources/Hooks/useStore'

const AddTokenButton = () => (
  <Cluster>
    <ClusterRow>
      <ClusterValue
        onClick={() => {
          link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken' } })
        }}
      >
        <div
          style={{
            padding: '12px',
            textTransform: 'uppercase',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          {'Add Token'}
        </div>
      </ClusterValue>
    </ClusterRow>
  </Cluster>
)

const ShowHiddenButton = ({ account, moduleId, hiddenBalances }) => {
  const showHiddenBalances = () => {
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
  }

  return (
    <div className='signerBalanceButtons'>
      <div className='signerBalanceButton signerBalanceShowAll' onClick={showHiddenBalances}>
        {`+${hiddenBalances.length} Hidden`}
      </div>
    </div>
  )
}

const AccountFilter = ({ balanceFilter, setBalanceFilter }) => {
  return (
    <div className='panelFilterAccount'>
      <div className='panelFilterIcon'>{svg.search(12)}</div>
      <div className='panelFilterInput'>
        <input
          tabIndex='-1'
          type='text'
          spellCheck='false'
          onChange={(e) => setBalanceFilter(e.target.value)}
          value={balanceFilter}
        />
      </div>
      {balanceFilter && (
        <div className='panelFilterClear' onClick={() => setBalanceFilter('')}>
          {svg.close(12)}
        </div>
      )}
    </div>
  )
}

const BalancesExpanded = ({
  getBalances,
  shouldShowTotalValue,
  isHotSigner,
  expandedData,
  moduleId,
  account
}) => {
  const [balanceFilter, setBalanceFilter] = useState('')
  const tokenPreferences = useStore('main.assetPreferences.tokens') || {}
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

  const footerButton = !expandedData.hidden && (
    <ShowHiddenButton account={account} moduleId={moduleId} hiddenBalances={hiddenBalances} />
  )

  return (
    <div className='accountViewScroll'>
      <AccountFilter balanceFilter={balanceFilter} setBalanceFilter={setBalanceFilter} />
      <ClusterBox>
        <BalancesList
          balances={expandedData.hidden ? hiddenBalances : allBalances}
          displayValue={expandedData.hidden ? hiddenTotalDisplayValue : totalDisplayValue}
          allChainsUpdated={allChainsUpdated}
          footerButton={footerButton}
        />
      </ClusterBox>

      {!expandedData.hidden && (
        <div>
          {totalValue.toNumber() > 10000 && isHotSigner && (
            <HighValueWarning updated={shouldShowTotalValue} />
          )}
          <AddTokenButton />
        </div>
      )}
    </div>
  )
}

export default BalancesExpanded
