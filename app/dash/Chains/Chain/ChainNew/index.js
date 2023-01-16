import React, { useState } from 'react'
import link from '../../../../../resources/link'

import chainDefault from '../chainDefault'

//TODO: Can these be abstracted into a common ChainInput component?
//TODO: Add inputs for Icon & Native Currency name
//TODO: Make sure that works for editing also...
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
    chain.symbol !== chainDefault.symbol &&
    chain.nativeCurrency &&
    chain.nativeCurrency !== chainDefault.nativeCurrency
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
  nativeCurrency,
  icon,
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
    nativeCurrency: nativeCurrency || chainDefault.nativeCurrency,
    icon: icon || chainDefault.icon,
    isTestnet: isTestnet || chainDefault.isTestnet,
    primaryColor: primaryColor || chainDefault.primaryColor,
    primaryRpc: primaryRpc || '',
    secondaryRpc: secondaryRpc || ''
  }

  // state
  const [currentColor, setPrimaryColor] = useState(newChain.primaryColor)
  const [currentName, setName] = useState(newChain.name)
  const [currentSymbol, setSymbol] = useState(newChain.symbol)
  const [currentNativeCurrency, setNativeCurrency] = useState(newChain.nativeCurrency)
  const [currentChainIcon, setChainIcon] = useState(newChain.icon)
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
    nativeCurrency: currentNativeCurrency,
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
      {/* TODO: hook in native currency here... */}
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
              link.send('tray:addChain', updatedChain)
              link.send('tray:action', 'backDash')
            }
          }}
        />
      </div>
    </div>
  )
}
