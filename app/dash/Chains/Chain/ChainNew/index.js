import React, { useState } from 'react'
import link from '../../../../../resources/link'

import chainDefault from '../chainDefault'

import {
  ChainHeader,
  EditChainColor,
  EditChainName,
  EditChainSymbol,
  EditChainId,
  EditTestnet,
  EditChainExplorer,
  EditRPC,
  SubmitChainButton
} from '../Components'

const isChainFilled = (chain) => {
  return (
    chain.id &&
    chain.id !== chainDefault.id &&
    chain.name &&
    chain.name !== chainDefault.name &&
    chain.symbol &&
    chain.symbol !== chainDefault.symbol
  )
}

const isValidRpc = (urlStr) => {
  try {
    const url = new URL(urlStr)
    return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)
  } catch (e) {
    return false
  }
}

export default ({
  id,
  name,
  type,
  explorer,
  symbol,
  isTestnet,
  primaryColor,
  primaryRpc,
  secondaryRpc,
  existingChains
}) => {
  const newChain = {
    id: id || chainDefault.id,
    name: name || chainDefault.name,
    type: type || chainDefault.type,
    explorer: explorer || chainDefault.explorer,
    symbol: symbol || chainDefault.symbol,
    isTestnet: isTestnet || chainDefault.isTestnet,
    primaryColor: primaryColor || chainDefault.primaryColor,
    primaryRpc: primaryRpc || '',
    secondaryRpc: secondaryRpc || ''
  }

  // state
  const [currentColor, setPrimaryColor] = useState(newChain.primaryColor)
  const [currentName, setName] = useState(newChain.name)
  const [currentSymbol, setSymbol] = useState(newChain.symbol)
  const [currentChainId, setChainId] = useState(newChain.id)
  const [currentExplorer, setExplorer] = useState(newChain.explorer)
  const [currentTestnet, setTestnet] = useState(newChain.isTestnet)
  const [currentPrimaryRPC, setPrimaryRPC] = useState(newChain.primaryRpc)
  const [currentSecondaryRPC, setSecondaryRPC] = useState(newChain.secondaryRpc)

  const updatedChain = {
    type: 'ethereum',
    id: currentChainId,
    name: currentName,
    explorer: currentExplorer,
    symbol: currentSymbol,
    isTestnet: currentTestnet,
    primaryColor: currentColor,
    primaryRpc: currentPrimaryRPC,
    secondaryRpc: currentSecondaryRPC
  }

  const validateChain = (chain) => {
    if (existingChains.includes(parseInt(chain.id))) {
      return { valid: false, text: 'Chain ID Already Exists' }
    }

    if (!isChainFilled(chain)) {
      return { valid: false, text: 'Fill Chain Details' }
    }

    if (chain.primaryRpc && !isValidRpc(chain.primaryRpc)) {
      return { valid: false, text: 'Invalid primary RPC' }
    }

    if (chain.secondaryRpc && !isValidRpc(chain.secondaryRpc)) {
      return { valid: false, text: 'Invalid secondary RPC' }
    }

    return { valid: true, text: 'Add Chain' }
  }

  const chainValidation = validateChain(updatedChain)

  return (
    <div key={'expandedChain'} className='network cardShow'>
      <ChainHeader type={type} id={id} primaryColor={currentColor} name={currentName} />
      <EditChainColor currentColor={currentColor} onChange={setPrimaryColor} />
      <EditChainName currentName={currentName} onChange={setName} />
      <EditChainId chainId={currentChainId} onChange={setChainId} />
      <EditChainExplorer currentExplorer={currentExplorer} onChange={setExplorer} />
      <EditChainSymbol currentSymbol={currentSymbol} onChange={setSymbol} />
      <EditRPC
        currentRPC={currentPrimaryRPC}
        label={'Primary RPC'}
        rpcDefault={chainDefault.primaryRpc}
        onChange={setPrimaryRPC}
      />
      <EditRPC
        currentRPC={currentSecondaryRPC}
        label={'Secondary RPC'}
        rpcDefault={chainDefault.secondaryRpc}
        onChange={setSecondaryRPC}
      />
      <EditTestnet testnet={currentTestnet} onChange={setTestnet} />
      <div className='chainRow chainRowRemove'>
        <SubmitChainButton
          text={chainValidation.text}
          textColor={chainValidation.valid ? 'var(--good)' : ''}
          enabled={chainValidation.valid}
          onClick={() => {
            if (chainValidation.valid) {
              const nav = store('windows.dash.nav')
              const chainsView = { view: 'chains', data: {} }
              link.send('tray:addChain', updatedChain)

              // if previous navItem is the chains panel, go back
              if (JSON.stringify(nav[1]) === JSON.stringify(chainsView)) {
                link.send('tray:action', 'backDash')
              } else {
                // otherwise update the current navItem to show the chains panel
                link.send('nav:update', 'dash', chainsView, false)
              }
            }
          }}
        />
      </div>
    </div>
  )
}
