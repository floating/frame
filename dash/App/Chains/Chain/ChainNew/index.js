import React, { useState } from 'react'
import link from '../../../../../resources/link'

// import Connection from '../Connection'
import { SubmitButton } from '../Buttons'

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

function RPCInput ({ label, text, defaultText, updateText }) {
  const id = label.split(' ').map(s => s.toLowerCase()).join('-')

  return (
    <div className='chainExplorer chainInputField'>
      <label htmlFor={id} className='chainInputLabel'>{label}</label>
      <input
        id={id}
        className={text === defaultText ? 'chainInput chainInputDim' : 'chainInput'}
        value={text}
        spellCheck='false'
        onChange={(e) => {
          updateText(e.target.value)
        }}
        onFocus={(e) => {
          if (e.target.value === defaultText) updateText('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') updateText(defaultText)
        }}
      />
    </div>
  )
}

const validateChain = () => {

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
          link.send('tray:action', 'setChainColor', id, color)
        }}
      />
      <EditChainName
        currentName={currentName}
        onChange={name => {
          setName(name)
          console.log('Update chain name to ', name)
        }}
      />
      <EditChainId
        chainId={currentChainId}
        onChange={id => {
          setChainId(id)
          console.log('Update chain id to ', id)
        }}
      />
      <EditChainExplorer
        currentExplorer={currentExplorer}
        onChange={explorer => {
          setExplorer(explorer)
          console.log('Update chain explorer to ', explorer)
        }}
      />
      <EditChainSymbol
        currentSymbol={currentSymbol}
        onChange={symbol => {
          setSymbol(symbol)
          console.log('Update chain symbol to ', symbol)
        }}
      />
      <EditTestnet
        testnet={currentTestnet}
        onChange={testnet => {
          setTestnet(testnet)
          // On color change, update existing chain
          console.log('Update chain testnet to ', testnet)
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
        <SubmitButton
          text='Add Chain'
          handleClick={() => {
            const updatedChain = {
              type: 'ethereum',
              id: currentChainId,
              name: currentName,
              explorer: currentExplorer,
              symbol: currentSymbol,
              isTestnet: currentTestnet,
              primaryColor: currentColor,
            }


            // const chainToAdd = {
            //   ...submittedChain,
            //   primaryRpc: this.state.primaryRpc,
            //   secondaryRpc: this.state.secondaryRpc
            // }
        
            // link.send('tray:addChain', chainToAdd)

            // chainIdExists (chainId) {
            //   const existingChains = Object.keys(this.store('main.networks.ethereum')).map(id => parseInt(id))
            //   return existingChains.includes(parseInt(chainId))
            // }

            console.log('VALIDATE and SUBMIT THIS UPDATED CHAIN', updatedChain)
          }}
        />
      </div>
    </div>
  )
}
