import React, { useState } from 'react'
import link from '../../../../../resources/link'

import Connection from '../Connection'
import { DangerousSubmitButton } from '../Buttons'

import { ChainHeader, EditChainColor, EditChainName, EditChainSymbol, EditChainId, EditTestnet, EditChainExplorer, ChainFooter } from '../Components'

export default (props) => {
  // props
  const { id, name, type, explorer, symbol, isTestnet, filter, on, connection, primaryColor, icon, price } = props
  const chain = { id, type, name, isTestnet, symbol, explorer }

  // state
  const [currentColor, setPrimaryColor] = useState(primaryColor)
  const [currentName, setName] = useState(name)
  const [currentSymbol, setSymbol] = useState(symbol)
  // const [currentChainId, setChainId] = useState(id)
  const [currentExplorer, setExplorer] = useState(explorer)
  const [currentTestnet, setTestnet] = useState(isTestnet)

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
          // link.send('tray:action', 'setChainColor', chain.id, color)
          console.log('Update chain name to ', name)
        }}
      />
      <EditChainExplorer
        currentExplorer={currentExplorer}
        onChange={explorer => {
          setExplorer(explorer)
          // link.send('tray:action', 'setChainColor', chain.id, color)
          console.log('Update chain explorer to ', explorer)
        }}
      />
      <EditChainSymbol
        currentSymbol={currentSymbol}
        onChange={symbol => {
          setSymbol(symbol)
          // link.send('tray:action', 'setChainColor', chain.id, color)
          console.log('Update chain symbol to ', symbol)
        }}
      />
      <ChainFooter 
        symbol={symbol} 
        price={price} 
      />
      <EditTestnet
        testnet={currentTestnet}
        onChange={testnet => {
          setTestnet(testnet)
          // link.send('tray:action', 'setChainColor', chain.id, color)
          console.log('Update chain testnet to ', testnet)
        }}
      />
      <div className='chainModules'>
        <Connection expanded={true} connection={connection} {...chain} />
      </div>
      <div className='chainRow chainRowRemove'>
        <DangerousSubmitButton
          text='Remove Chain'
          handleClick={() => {
            const confirmAction = { view: 'notify', data: { notify: 'confirmRemoveChain', notifyData: { chain } } }
            link.send('tray:action', 'navDash', confirmAction)
          }}
        />
      </div>
    </div>
  )
}
