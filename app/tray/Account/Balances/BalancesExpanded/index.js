import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { isNetworkConnected } from '../../../../../resources/utils/chains'
import Balance from '../Balance'
import {
  formatUsdRate,
  createBalance,
  sortByTotalValue as byTotalValue,
  isNativeCurrency
} from '../../../../../resources/domain/balance'
import { matchFilter } from '../../../../../resources/utils'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

const BalancesExpanded = ({
  ethereumNetworks,
  populatedChains,
  networksMeta,
  allChainsUpdated,
  storedBalances,
  rates,
  lastSignerType
}) => {
  const [balanceFilter, setBalanceFilter] = useState('')
  const [showHighHotMessage, setShowHighHotMessage] = useState(true)
  const getBalances = (rawBalances, rates) => {
    const balances = rawBalances
      // only show balances from connected networks
      .filter((rawBalance) => isNetworkConnected(ethereumNetworks[rawBalance.chainId]))
      .map((rawBalance) => {
        const isNative = isNativeCurrency(rawBalance.address)
        const nativeCurrencyInfo = networksMeta[rawBalance.chainId].nativeCurrency || {}

        const rate = isNative ? nativeCurrencyInfo : rates[rawBalance.address || rawBalance.symbol] || {}
        const logoURI = (isNative && nativeCurrencyInfo.icon) || rawBalance.logoURI
        const name = isNative
          ? nativeCurrencyInfo.name || ethereumNetworks[rawBalance.chainId].name
          : rawBalance.name
        const decimals = isNative ? nativeCurrencyInfo.decimals || 18 : rawBalance.decimals
        const symbol = (isNative && nativeCurrencyInfo.symbol) || rawBalance.symbol

        return createBalance(
          { ...rawBalance, logoURI, name, decimals, symbol },
          ethereumNetworks[rawBalance.chainId].isTestnet ? { price: 0 } : rate.usd
        )
      })
      .filter((balance) => {
        const filter = balanceFilter
        const chainName = ethereumNetworks[balance.chainId].name
        return (
          populatedChains[balance.chainId] &&
          populatedChains[balance.chainId].expires > Date.now() &&
          matchFilter(filter, [chainName, balance.name, balance.symbol])
        )
      })
      .sort(byTotalValue)

    const totalValue = balances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))

    return { balances, totalDisplayValue: formatUsdRate(totalValue, 0), totalValue }
  }

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

  const { balances, totalDisplayValue, totalValue } = getBalances(storedBalances, rates)

  const hotSigner = ['ring', 'seed'].includes(lastSignerType)

  return (
    <div className='accountViewScroll'>
      {renderAccountFilter()}
      <ClusterBox>
        <Cluster>
          {balances.map(({ chainId, symbol, ...balance }, i) => {
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
            {balances.length && allChainsUpdated ? totalDisplayValue : '---.--'}
          </div>
        </div>
      </div>
      {totalValue.toNumber() > 10000 && hotSigner ? (
        <div
          className='signerBalanceWarning'
          onClick={() => setShowHighHotMessage(!showHighHotMessage)}
          style={!allChainsUpdated ? { opacity: 0 } : { opacity: 1 }}
        >
          <div className='signerBalanceWarningTitle'>{'high value account is using hot signer'}</div>
          {showHighHotMessage ? (
            <div className='signerBalanceWarningMessage'>
              {
                'We recommend using one of our supported hardware signers to increase the security of your account'
              }
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default BalancesExpanded
