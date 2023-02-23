import React, { useState, useEffect } from 'react'

import link from '../../../../../resources/link'
import { Cluster } from '../../../../../resources/Components/Cluster'
import Connection from '../Connection'

import {
  SubmitChainButton,
  ChainHeader,
  EditChainColor,
  EditChainName,
  EditChainSymbol,
  EditNativeCurrencyName,
  EditChainIcon,
  EditTestnet,
  EditChainExplorer,
  EditNativeCurrencyIcon
} from '../Components'

export default (props) => {
  // props
  const {
    id,
    name,
    type,
    explorer,
    symbol,
    isTestnet,
    on,
    connection,
    primaryColor,
    icon,
    nativeCurrencyIcon,
    price,
    nativeCurrencyName
  } = props
  const chain = { id, type, name, isTestnet, symbol, explorer, primaryColor }

  // state
  const [currentColor, setPrimaryColor] = useState(primaryColor)
  const [currentName, setName] = useState(name)
  const [currentSymbol, setSymbol] = useState(symbol)
  const [currentExplorer, setExplorer] = useState(explorer)
  const [currentTestnet, setTestnet] = useState(isTestnet)
  const [currentNativeCurrencyName, setNativeCurrencyName] = useState(nativeCurrencyName)
  const [currentIcon, setIcon] = useState(icon)
  const [currentCurrencyIcon, setCurrencyIcon] = useState(nativeCurrencyIcon)

  // effects
  useEffect(() => {
    const updatedChain = {
      id,
      type,
      primaryColor: currentColor,
      isTestnet: currentTestnet,
      explorer: currentExplorer,
      icon: currentIcon,
      nativeCurrencyIcon: currentCurrencyIcon,
      name: currentName,
      symbol: currentSymbol,
      nativeCurrencyName: currentNativeCurrencyName
    }

    link.send('tray:action', 'updateNetwork', chain, updatedChain)
  }, [
    currentColor,
    currentName,
    currentSymbol,
    currentExplorer,
    currentTestnet,
    currentIcon,
    currentNativeCurrencyName,
    currentCurrencyIcon
  ])

  useEffect(() => {
    link.send('tray:action', 'setChainColor', chain.id, currentColor)
  }, [currentColor])

  const isMainnet = id === 1

  return (
    <div key={'expandedChain'} className='network cardShow'>
      <ChainHeader
        type={type}
        id={id}
        primaryColor={currentColor}
        icon={icon}
        name={currentName}
        on={on}
        showToggle={true}
      />
      <EditChainColor currentColor={primaryColor} onChange={setPrimaryColor} />
      <EditChainName currentName={currentName} onChange={setName} />
      <EditChainExplorer currentExplorer={currentExplorer} onChange={setExplorer} />
      <EditChainSymbol currentSymbol={currentSymbol} onChange={setSymbol} />
      <EditNativeCurrencyName
        currentNativeCurrency={currentNativeCurrencyName}
        onChange={setNativeCurrencyName}
      />
      <EditChainIcon currentIcon={currentIcon} onChange={setIcon} />
      <EditNativeCurrencyIcon currentCurrencyIcon={currentCurrencyIcon} onChange={setCurrencyIcon} />
      {!isMainnet && <EditTestnet testnet={currentTestnet} onChange={setTestnet} />}
      <Cluster style={{ marginBottom: '30px' }}>
        <Connection expanded={true} connection={connection} {...chain} />
      </Cluster>
      {!isMainnet ? (
        <div className='chainRow chainRowRemove'>
          <SubmitChainButton
            text='Remove Chain'
            enabled={true}
            textColor={'var(--bad)'}
            onClick={() => {
              const confirmAction = {
                view: 'notify',
                data: { notify: 'confirmRemoveChain', notifyData: { chain } }
              }
              link.send('tray:action', 'navDash', confirmAction)
            }}
          />
        </div>
      ) : (
        <div style={{ height: '8px' }} />
      )}
    </div>
  )
}
