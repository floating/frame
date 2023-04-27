import React, { useState } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import Balance from '../Balance'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
import HighValueWarning from '../Warning'

const BalancesExpanded = ({ getBalances, allChainsUpdated, isHotSigner }) => {
  const [balanceFilter, setBalanceFilter] = useState('')

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

  const { balances: allBalances, totalDisplayValue, totalValue } = getBalances(balanceFilter)

  return (
    <div className='accountViewScroll'>
      {renderAccountFilter()}
      <ClusterBox>
        <Cluster>
          {allBalances.map(({ chainId, symbol, ...balance }, i) => {
            return (
              <ClusterRow key={chainId + symbol + balance.address}>
                <ClusterValue>
                  <Balance chainId={chainId} symbol={symbol} balance={balance} i={i} scanning={false} />
                </ClusterValue>
              </ClusterRow>
            )
          })}
        </Cluster>
      </ClusterBox>
      <div className='signerBalanceTotal' style={{ opacity: allChainsUpdated ? 1 : 0 }}>
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
        <div className='signerBalanceTotalText'>
          <div className='signerBalanceTotalLabel'>{'Total'}</div>
          <div className='signerBalanceTotalValue'>
            {svg.usd(11)}
            {allBalances.length && allChainsUpdated ? totalDisplayValue : '---.--'}
          </div>
        </div>
      </div>
      {totalValue.toNumber() > 10000 && isHotSigner && <HighValueWarning updated={allChainsUpdated} />}
    </div>
  )
}

export default BalancesExpanded
