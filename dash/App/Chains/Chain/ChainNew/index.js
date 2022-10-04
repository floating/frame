import React, { useState } from 'react'
import link from '../../../../../resources/link'

import { ChainHeader, EditChainColor, EditChainName, EditChainSymbol, EditChainId, EditTestnet, EditChainExplorer } from '../Components'

const chainDefault = {
  type: 'ethereum',
  id: 'Chain ID',
  name: 'Chain Name',
  explorer: 'Block Explorer',
  symbol: 'Native Symbol',
  isTestnet: false,
  primaryColor: 'accent2'
}

// function RPCInput ({ label, text, defaultText, updateText }) {
//   const id = label.split(' ').map(s => s.toLowerCase()).join('-')

//   return (
//     <div className='chainExplorer chainInputField'>
//       <label htmlFor={id} className='chainInputLabel'>{label}</label>
//       <input
//         id={id}
//         className={text === defaultText ? 'chainInput chainInputDim' : 'chainInput'}
//         value={text}
//         spellCheck='false'
//         onChange={(e) => {
//           updateText(e.target.value)
//         }}
//         onFocus={(e) => {
//           if (e.target.value === defaultText) updateText('')
//         }}
//         onBlur={(e) => {
//           if (e.target.value === '') updateText(defaultText)
//         }}
//       />
//     </div>
//   )
// }

const SubmitChainButton = ({ text, enabled, textColor, onClick }) => {
  return (
    <div
      role='button'
      className={enabled ? 'addTokenSubmit addTokenSubmitEnabled' : 'addTokenSubmit'} 
      style={{ color: textColor }}
      onClick={(e) => {
        // Left Click
        if (e.button === 0) onClick()
      }}
    >
      <span>{text}</span>
    </div>
  )
}

const isChainFilled = chain => {
  return (
    chain.id && chain.id !== chainDefault.id &&
    chain.name && chain.name !== chainDefault.name &&
    chain.symbol && chain.symbol !== chainDefault.symbol
  )
}

const chainIdExists = (chainId) => {
  if (window.store) {
    const existingChains = Object.keys(store('main.networks.ethereum')).map(id => parseInt(id))
    return existingChains.includes(parseInt(chainId))
  }
  return false
}

const validateChain = chain => { 
  if (!isChainFilled(chain)) {
    return { valid: false, text: 'Fill Chain Details' }
  } else if (chainIdExists(chain.id)) {
    return { valid: false, text: 'Chain ID Already Exists' }
  } else {
    return { valid: true, text: 'Add Chain' }
  }
}

export default ({ id, name, type, explorer, symbol, isTestnet, primaryColor }) => {

  const newChain = {
    id: id || chainDefault.id,
    name: name || chainDefault.name,
    type: type || chainDefault.type,
    explorer: explorer || chainDefault.explorer,
    symbol: symbol || chainDefault.symbol,
    isTestnet: isTestnet || chainDefault.isTestnet,
    primaryColor: primaryColor || chainDefault.primaryColor,
  }

  // state
  const [currentColor, setPrimaryColor] = useState(newChain.primaryColor)
  const [currentName, setName] = useState(newChain.name)
  const [currentSymbol, setSymbol] = useState(newChain.symbol)
  const [currentChainId, setChainId] = useState(newChain.id)
  const [currentExplorer, setExplorer] = useState(newChain.explorer)
  const [currentTestnet, setTestnet] = useState(newChain.isTestnet)

  const updatedChain = {
    type: 'ethereum',
    id: currentChainId,
    name: currentName,
    explorer: currentExplorer,
    symbol: currentSymbol,
    isTestnet: currentTestnet,
    primaryColor: currentColor,
  }

  const chainValidation = validateChain(updatedChain)

  return (
    <div key={'expandedChain'} className='network cardShow'>
      <ChainHeader 
        type={type}
        id={id}
        primaryColor={currentColor}
        name={currentName}
      />
      <EditChainColor 
        currentColor={currentColor} 
        onChange={color => {
          setPrimaryColor(color)
        }}
      />
      <EditChainName
        currentName={currentName}
        onChange={name => {
          setName(name)
        }}
      />
      <EditChainId
        chainId={currentChainId}
        onChange={id => {
          setChainId(id)
        }}
      />
      <EditChainExplorer
        currentExplorer={currentExplorer}
        onChange={explorer => {
          setExplorer(explorer)
        }}
      />
      <EditChainSymbol
        currentSymbol={currentSymbol}
        onChange={symbol => {
          setSymbol(symbol)
        }}
      />
      <EditTestnet
        testnet={currentTestnet}
        onChange={testnet => {
          setTestnet(testnet)
        }}
      />

      {/* <RPCInput
        text={this.state.primaryRpc}
        defaultText={defaults.primaryRpc}
        label='Primary RPC'
        updateText={(text) => this.setState({ primaryRpc: text })}
      />
      
      <RPCInput
        text={this.state.secondaryRpc}
        defaultText={defaults.secondaryRpc}
        label='Secondary RPC'
        updateText={(text) => this.setState({ secondaryRpc: text })}
      /> */}
      
      <div className='chainRow chainRowRemove'>
        <SubmitChainButton
          text={chainValidation.text}
          textColor={chainValidation.valid ? 'var(--good)' : ''}
          enabled={chainValidation.valid}
          onClick={() => {
            link.send('tray:addChain', updatedChain)
            link.send('tray:action', 'backDash')
          }}
        />
      </div>
    </div>
  )
}
