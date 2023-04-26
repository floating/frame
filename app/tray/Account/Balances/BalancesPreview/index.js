import React, { useState } from 'react'
import BigNumber from 'bignumber.js'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { isNetworkConnected } from '../../../../../resources/utils/chains'
import {
  formatUsdRate,
  createBalance,
  sortByTotalValue as byTotalValue,
  isNativeCurrency
} from '../../../../../resources/domain/balance'
import { matchFilter } from '../../../../../resources/utils'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import Balance from '../Balance'

const BalancesPreview = ({
  populatedChains,
  allChainsUpdated,
  filter = '',
  lastSignerType,
  storedBalances,
  rates,
  ethereumNetworks,
  moduleId,
  networksMeta,
  account
}) => {
  const [showHighHotMessage, setShowHighHotMessage] = useState(true)

  const getBalances = (rawBalances, rates) => {
    return (
      rawBalances
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
        .sort(byTotalValue)
    )
  }

  const allBalances = getBalances(storedBalances, rates)

  const filteredBalances = allBalances.reduce((balances, balance) => {
    const chainName = ethereumNetworks[balance.chainId].name
    const { expires } = populatedChains[balance.chainId] || {}
    if (expires && Date.now() < expires && matchFilter(filter, [chainName, balance.name, balance.symbol])) {
      balances.push(balance)
    }
    return balances
  }, [])

  const totalValue = filteredBalances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))
  const totalDisplayValue = formatUsdRate(totalValue, 0)

  const balances = filteredBalances.slice(0, 4)

  const hotSigner = ['ring', 'seed'].includes(lastSignerType)

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
            {filteredBalances.length - balances.length > 0
              ? `+${filteredBalances.length - balances.length} More`
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
      {totalValue.toNumber() > 10000 && hotSigner ? (
        //TODO: extract to component...
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

export default BalancesPreview
