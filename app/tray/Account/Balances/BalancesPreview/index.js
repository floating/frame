import React from 'react'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import useAccountModule from '../../../../../resources/Hooks/useAccountModule'
import useStore from '../../../../../resources/Hooks/useStore'

import HighValueWarning from '../Warning'

import BalancesList from '../BalancesList'
import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

const BalancesPreview = ({ allChainsUpdated, moduleId, getBalances, account, filter, isHotSigner }) => {
  const [moduleRef] = useAccountModule(moduleId)
  const hiddenTokens = useStore('main.hiddenTokens') || []

  const { balances: allBalances, totalValue, totalDisplayValue } = getBalances(filter, hiddenTokens)

  const balances = allBalances.slice(0, 4)

  return (
    <div ref={moduleRef} className='balancesBlock'>
      <div className={'moduleHeader'}>
        <span>{svg.tokens(13)}</span>
        <span>{'Balances'}</span>
      </div>
      <BalancesList balances={balances} />
      {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={allChainsUpdated} />}
      <div className='signerBalanceTotal'>
        <div className='signerBalanceButtons'>
          <div
            className='signerBalanceButton signerBalanceShowAll'
            onClick={() => {
              const crumb = {
                view: 'expandedModule',
                data: {
                  id: moduleId,
                  account: account
                }
              }
              link.send('nav:forward', 'panel', crumb)
            }}
          >
            {allBalances.length - balances.length > 0
              ? `+${allBalances.length - balances.length} More`
              : 'More'}
          </div>
        </div>
        {balances.length && allChainsUpdated ? (
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
    </div>
  )
}

export default BalancesPreview
