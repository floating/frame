import React from 'react'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import Balance from '../Balance'
import HighValueWarning from '../Warning'

const BalancesPreview = ({ allChainsUpdated, moduleId, getBalances, account, filter, isHotSigner }) => {
  const { balances: allBalances, totalValue, totalDisplayValue } = getBalances(filter)

  const balances = allBalances.slice(0, 4)

  return (
    <div className='balancesBlock'>
      <div className={'moduleHeader'}>
        <span>{svg.tokens(13)}</span>
        <span>{'Balances'}</span>
      </div>
      <Cluster>
        {balances.map(({ chainId, symbol, ...balance }, i) => {
          return (
            <ClusterRow key={chainId + symbol}>
              <ClusterValue>
                <Balance chainId={chainId} symbol={symbol} balance={balance} i={i} scanning={false} />
              </ClusterValue>
            </ClusterRow>
          )
        })}
      </Cluster>
      <div className='signerBalanceTotal' style={{ opacity: 1 }}>
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

        <div className='signerBalanceTotalText'>
          <div className='signerBalanceTotalLabel'>{'Total'}</div>
          <div className='signerBalanceTotalValue'>
            {svg.usd(11)}
            {balances.length && allChainsUpdated ? totalDisplayValue : '---.--'}
          </div>
        </div>
      </div>
      {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={allChainsUpdated} />}
    </div>
  )
}

export default BalancesPreview
