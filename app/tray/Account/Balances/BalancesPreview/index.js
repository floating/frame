import React from 'react'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import useAccountModule from '../../../../../resources/Hooks/useAccountModule'
import useStore from '../../../../../resources/Hooks/useStore'

import HighValueWarning from '../Warning'

import BalancesList from '../BalancesList'

const ShowMoreButton = ({ moduleId, account, balanceCount, balances }) => {
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
        {balanceCount - balances.length > 0 ? `+${balanceCount - balances.length} More` : 'More'}
      </div>
    </div>
  )
}

const BalancesPreview = ({ allChainsUpdated, moduleId, getBalances, account, filter, isHotSigner }) => {
  const [moduleRef] = useAccountModule(moduleId)
  const tokenPreferences = useStore('main.assetPreferences.tokens') || {}

  const {
    visible: { balances, totalValue, totalDisplayValue },
    hidden: { balances: hiddenBalances }
  } = getBalances(filter, tokenPreferences)

  const previewBalances = balances.slice(0, 4)

  const balanceCount = balances.length + hiddenBalances.length

  const footerButton = (
    <ShowMoreButton
      moduleId={moduleId}
      account={account}
      balanceCount={balanceCount}
      balances={previewBalances}
    />
  )

  return (
    <div ref={moduleRef} className='balancesBlock'>
      <div className={'moduleHeader'}>
        <span>{svg.tokens(13)}</span>
        <span>{'Balances'}</span>
      </div>
      <BalancesList
        balances={previewBalances}
        footerButton={footerButton}
        displayValue={totalDisplayValue}
        allChainsUpdated={allChainsUpdated}
      />
      {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={allChainsUpdated} />}
    </div>
  )
}

export default BalancesPreview
