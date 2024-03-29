import React from 'react'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import useAccountModule from '../../../../../resources/Hooks/useAccountModule'
import useStore from '../../../../../resources/Hooks/useStore'

import HighValueWarning from '../Warning'

import BalancesList from '../BalancesList'

const ShowMoreButton = ({ moduleId, account, allBalances, balances }) => {
  const showMore = () => {
    const crumb = {
      view: 'expandedModule',
      data: {
        id: moduleId,
        account: account
      }
    }
    link.send('nav:forward', 'panel', crumb)
  }

  return (
    <div className='signerBalanceButtons'>
      <div className='signerBalanceButton signerBalanceShowAll' onClick={showMore}>
        {allBalances.length - balances.length > 0 ? `+${allBalances.length - balances.length} More` : 'More'}
      </div>
    </div>
  )
}

const BalancesPreview = ({ shouldShowTotalValue, moduleId, getBalances, account, filter, isHotSigner }) => {
  const [moduleRef] = useAccountModule(moduleId)
  const tokenPreferences = useStore('main.assetPreferences.tokens') || {}

  const { balances: allBalances, totalValue, totalDisplayValue } = getBalances(filter, tokenPreferences)

  const balances = allBalances.slice(0, 4)

  const footerButton = (
    <ShowMoreButton moduleId={moduleId} account={account} allBalances={allBalances} balances={balances} />
  )

  return (
    <div ref={moduleRef} className='balancesBlock'>
      <div className={'moduleHeader'}>
        <span>{svg.tokens(13)}</span>
        <span>{'Balances'}</span>
      </div>
      <BalancesList
        balances={balances}
        footerButton={footerButton}
        displayValue={totalDisplayValue}
        shouldShowTotalValue={shouldShowTotalValue}
      />
      {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={shouldShowTotalValue} />}
    </div>
  )
}

export default BalancesPreview
