import React, { useState } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import HighValueWarning from '../Warning'
import BalancesList from '../BalancesList'

import useStore from '../../../../../resources/Hooks/useStore'

const AddTokenButton = () => (
  <div
    className='signerBalanceButton signerBalanceAddToken'
    onMouseDown={() => {
      link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken' } })
    }}
  >
    <span>Add Token</span>
  </div>
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

      <BalancesList
        balances={expandedData.hidden ? hiddenBalances : allBalances}
        displayValue={expandedData.hidden ? hiddenTotalDisplayValue : totalDisplayValue}
        shouldShowTotalValue={shouldShowTotalValue}
        footerButton={footerButton}
      />
      <div className='signerBalanceFooter'>
        {!expandedData.hidden && <AddTokenButton />}
        {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={shouldShowTotalValue} />}
      </div>
    </div>
  )
}

export default BalancesExpanded
