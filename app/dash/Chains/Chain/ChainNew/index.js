import { useState } from 'react'

import chainDefault from '../chainDefault'
import link from '../../../../../resources/link'
import {
  ChainHeader,
  EditChainColor,
  EditChainName,
  EditChainSymbol,
  EditChainId,
  EditChainIcon,
  EditNativeCurrencyName,
  EditTestnet,
  EditChainExplorer,
  SubmitChainButton,
  EditNativeCurrencyIcon,
  EditSecondaryRPC,
  EditPrimaryRPC
} from '../Components'

const isChainFilled = (chain) => {
  return (
    chain.id &&
    chain.id !== chainDefault.id &&
    chain.name &&
    chain.name !== chainDefault.name &&
    chain.symbol &&
    chain.symbol !== chainDefault.symbol &&
    chain.nativeCurrencyName &&
    chain.nativeCurrencyName !== chainDefault.nativeCurrencyName
  )
}

const getUrl = (urlStr) => {
  try {
    return new URL(urlStr)
  } catch (e) {}
}

const isValidRpc = (urlStr) => {
  const url = getUrl(urlStr)
  return ['http:', 'https:', 'ws:', 'wss:'].includes(url?.protocol)
}

const isValidIcon = (urlStr) => Boolean(getUrl(urlStr))

export const Chain = ({
  id,
  name = '',
  type,
  explorer = '',
  symbol = '',
  nativeCurrencyName = '',
  nativeCurrencyIcon = '',
  icon = '',
  isTestnet = false,
  primaryColor = chainDefault.primaryColor,
  primaryRpc = '',
  secondaryRpc = '',
  existingChains,
  store
}) => {
  const newChain = {
    id,
    name,
    type,
    explorer,
    symbol,
    nativeCurrencyName,
    nativeCurrencyIcon,
    icon,
    isTestnet,
    primaryColor,
    primaryRpc,
    secondaryRpc
  }

  // state
  const [currentColor, setPrimaryColor] = useState(newChain.primaryColor)
  const [currentName, setName] = useState(newChain.name)
  const [currentSymbol, setSymbol] = useState(newChain.symbol)
  const [currentNativeCurrencyName, setNativeCurrencyName] = useState(newChain.nativeCurrencyName)
  const [currentChainIcon, setChainIcon] = useState(newChain.icon)
  const [currentCurrencyIcon, setCurrencyIcon] = useState(newChain.nativeCurrencyIcon)
  const [currentChainId, setChainId] = useState(newChain.id)
  const [currentExplorer, setExplorer] = useState(newChain.explorer)
  const [currentTestnet, setTestnet] = useState(newChain.isTestnet)
  const [currentPrimaryRPC, setPrimaryRPC] = useState(newChain.primaryRpc)
  const [currentSecondaryRPC, setSecondaryRPC] = useState(newChain.secondaryRpc)

  const currencyIcon = currentCurrencyIcon === chainDefault.nativeCurrencyIcon ? '' : currentCurrencyIcon
  const chainIcon = currentChainIcon === chainDefault.icon ? '' : currentChainIcon
  const updatedChain = {
    type: 'ethereum',
    id: currentChainId,
    name: currentName,
    explorer: currentExplorer,
    nativeCurrencyName: currentNativeCurrencyName,
    nativeCurrencyIcon: currencyIcon,
    icon: chainIcon,
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

    if (chain.icon && !isValidIcon(chain.icon)) {
      return { valid: false, text: 'Invalid Chain Icon' }
    }

    if (chain.nativeCurrencyIcon && !isValidIcon(chain.nativeCurrencyIcon)) {
      return { valid: false, text: 'Invalid Currency Icon' }
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
      {/* TODO: change order? */}
      <EditNativeCurrencyName
        currentNativeCurrency={currentNativeCurrencyName}
        onChange={setNativeCurrencyName}
      />
      <EditPrimaryRPC currentPrimaryRPC={currentPrimaryRPC} onChange={setPrimaryRPC} />
      <EditSecondaryRPC currentSecondaryRpc={currentSecondaryRPC} onChange={setSecondaryRPC} />
      <EditChainIcon currentIcon={currentChainIcon} onChange={setChainIcon} />
      <EditNativeCurrencyIcon currentCurrencyIcon={currentCurrencyIcon} onChange={setCurrencyIcon} />
      <EditTestnet testnet={currentTestnet} onChange={setTestnet} />
      <div className='chainRow chainRowRemove'>
        <SubmitChainButton
          text={chainValidation.text}
          textColor={chainValidation.valid ? 'var(--good)' : ''}
          enabled={chainValidation.valid}
          onClick={() => {
            if (chainValidation.valid) {
              const nav = store('windows.dash.nav')
              link.send('tray:addChain', updatedChain)

              // if previous navItem is the chains panel, go back
              if (nav[1]?.view === 'chains') {
                link.send('tray:action', 'backDash')
              } else {
                // otherwise update the current navItem to show the chains panel
                link.send('nav:update', 'dash', { view: 'chains', data: {} }, false)
              }
            }
          }}
        />
      </div>
    </div>
  )
}
