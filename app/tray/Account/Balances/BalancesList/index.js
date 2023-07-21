import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import useStore from '../../../../../resources/Hooks/useStore'

import Balance from '../Balance'

const MissingBalances = styled.div`
  position: absolute;
  right: 16px;
  bottom: 12px;
  height: 24px;
  width: 90px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--ghostZ);
  color: var(--mint);
  background: var(--ghostA);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
`

const LoadingDot = styled.div`
  height: 6px;
  width: 6px;
  border-radius: 50%;
  background: var(--moon);
  margin: 0px 8px 0px 0px;
`

const HiddenOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, transparent, var(--bad));
  opacity: 0.03;
  z-index: 10000;
`

const BalanceListFooter = ({ displayValue, footerButton, shouldShowTotalValue }) => {
  const [longLoading, setLongLoading] = useState(false)

  useEffect(() => {
    setLongLoading(false)
    if (!shouldShowTotalValue) setTimeout(() => setLongLoading(true), 8000)
  }, [shouldShowTotalValue])

  return (
    <div className='signerBalanceTotal'>
      {footerButton || <></>}
      {shouldShowTotalValue ? (
        <div className='signerBalanceTotalText'>
          <div className='signerBalanceTotalLabel'>{'Total'}</div>
          <div className='signerBalanceTotalValue'>
            {svg.usd(11)}
            {displayValue}
          </div>
        </div>
      ) : longLoading ? (
        <MissingBalances onClick={() => link.send('tray:action', 'navDash', { view: 'chains', data: {} })}>
          <LoadingDot />
          {'pending'}
        </MissingBalances>
      ) : (
        <div className='signerBalanceLoadingWave'>{svg.sine()}</div>
      )}
    </div>
  )
}

const BalancesList = ({ balances, displayValue, footerButton, shouldShowTotalValue }) => {
  const [open, setOpen] = useState(-1)
  const [confirming, setConfirming] = useState(false)
  const tokenPreferences = useStore('main.assetPreferences.tokens') || {}

  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 3000)
  }, [])

  return (
    <>
      <Cluster>
        {balances.map(({ chainId, symbol, address, ...balance }, i) => {
          const tokenId = `${chainId}:${address}`

          const preferences = tokenPreferences[tokenId]
          const hidden = preferences ? preferences.hidden : balance.hideByDefault || false

          return (
            <React.Fragment key={tokenId}>
              <ClusterRow>
                <ClusterValue onClick={shouldShowTotalValue ? () => setOpen(open === i ? -1 : i) : null}>
                  {hidden && <HiddenOverlay />}
                  <Balance
                    key={chainId + address}
                    chainId={chainId}
                    symbol={symbol}
                    address={address}
                    balance={balance}
                    i={i}
                    scanning={!shouldShowTotalValue && isLoading}
                  />
                </ClusterValue>
              </ClusterRow>
              {i === open &&
                (confirming ? (
                  <ClusterRow>
                    <ClusterValue grow={3}>
                      <div className='signerBalanceDrawerItem' style={{ color: 'var(--moon)' }}>
                        {hidden ? 'unhide this balance?' : 'hide this balance?'}
                      </div>
                    </ClusterValue>
                    <ClusterValue
                      grow={1}
                      onClick={() => {
                        setConfirming(false)
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{svg.x(16)}</div>
                    </ClusterValue>
                    <ClusterValue
                      grow={1}
                      onClick={() => {
                        setConfirming(false)
                        setOpen(-1)
                        link.send('tray:action', 'updateAssetPreferences', 'tokens', chainId, address, {
                          hidden: !hidden
                        })
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{svg.check(16)}</div>
                    </ClusterValue>
                  </ClusterRow>
                ) : (
                  <ClusterRow>
                    <ClusterValue
                      grow={3}
                      onClick={() => {
                        setOpen(-1)
                        link.send('*:addFrame', 'dappLauncher')
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{svg.send(14)}</div>
                    </ClusterValue>
                    <ClusterValue
                      grow={3}
                      onClick={() => {
                        setOpen(-1)
                        if (address === '0x0000000000000000000000000000000000000000') {
                          link.send('tray:openExplorer', {
                            type: 'token',
                            chain: { type: 'ethereum', id: chainId }
                          })
                        } else {
                          link.send('tray:openExplorer', {
                            type: 'token',
                            chain: { type: 'ethereum', id: chainId },
                            address
                          })
                        }
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{svg.telescope(16)}</div>
                    </ClusterValue>
                    <ClusterValue
                      grow={1}
                      onClick={() => {
                        setConfirming(true)
                      }}
                    >
                      <div className='signerBalanceDrawerItem'>{hidden ? svg.show(16) : svg.hide(16)}</div>
                    </ClusterValue>
                  </ClusterRow>
                ))}
            </React.Fragment>
          )
        })}
      </Cluster>
      <BalanceListFooter
        displayValue={displayValue}
        footerButton={footerButton}
        shouldShowTotalValue={shouldShowTotalValue}
      />
    </>
  )
}

export default BalancesList
