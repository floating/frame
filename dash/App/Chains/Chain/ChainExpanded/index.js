import React, { useState } from 'react'
import link from '../../../../../resources/link'

import Connection from '../Connection'

import { SubmitChainButton, ChainHeader, EditChainColor, EditChainName, EditChainSymbol, EditChainId, EditTestnet, EditChainExplorer, ChainFooter } from '../Components'

const updateChain = (chain, updatedChain) => {
  link.send('tray:action', 'updateNetwork', chain, updatedChain)
}

export default (props) => {
  // props
  const { id, name, type, explorer, symbol, isTestnet, on, connection, primaryColor, icon, price } = props
  const chain = { id, type, name, isTestnet, symbol, explorer, primaryColor }

  // state
  const [currentColor, setPrimaryColor] = useState(primaryColor)
  const [currentName, setName] = useState(name)
  const [currentSymbol, setSymbol] = useState(symbol)
  const [currentExplorer, setExplorer] = useState(explorer)
  const [currentTestnet, setTestnet] = useState(isTestnet)

  const updatedChain = {
    id,
    type,
    name: currentName,
    primaryColor: currentColor,
    isTestnet: currentTestnet,
    symbol: currentSymbol,
    explorer: currentExplorer
  }

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
      <EditChainColor 
        currentColor={primaryColor} 
        onChange={color => {
          setPrimaryColor(color)
          link.send('tray:action', 'setChainColor', chain.id, color)
        }}
      />
      <EditChainName
        currentName={currentName}
        onChange={name => {
          setName(name)
          updatedChain.name = name
          updateChain(chain, updatedChain)
        }}
      />
      <EditChainExplorer
        currentExplorer={currentExplorer}
        onChange={explorer => {
          setExplorer(explorer)
          updatedChain.explorer = explorer
          updateChain(chain, updatedChain)
        }}
      />
      <EditChainSymbol
        currentSymbol={currentSymbol}
        onChange={symbol => {
          setSymbol(symbol)
          updatedChain.symbol = symbol
          updateChain(chain, updatedChain)
        }}
      />
      <ChainFooter 
        symbol={symbol} 
        price={price} 
      />
      {id !== 1 ? (
        <EditTestnet
          testnet={currentTestnet}
          onChange={testnet => {
            setTestnet(testnet)
            updatedChain.isTestnet = testnet
            updateChain(chain, updatedChain)
          }}
        />
      ) : null}
      <div className='chainModules'>
        <Connection expanded={true} connection={connection} {...chain} />
      </div>
      {id !== 1 ? (
        <div className='chainRow chainRowRemove'>
          <SubmitChainButton
            text='Remove Chain'
            enabled={true}
            textColor={'var(--bad)'}
            onClick={() => {
              const confirmAction = { view: 'notify', data: { notify: 'confirmRemoveChain', notifyData: { chain } } }
              link.send('tray:action', 'navDash', confirmAction)
            }}
          />
        </div>
      ) : <div style={{ height: '8px' }} />}
    </div>
  )
}
