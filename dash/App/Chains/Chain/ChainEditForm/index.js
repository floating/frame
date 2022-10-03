import React, { useState } from 'react'

import link from '../../../../../resources/link'
import { DangerousSubmitButton } from '../Button'

const networkDefaults = {
  id: 'Chain ID',
  name: 'Chain Name',
  explorer: 'Block Explorer',
  symbol: 'Native Symbol',
  isTestnet: false,
  color: 'accent3'
}

// function isNetworkReady (network) {
//   return (
//     network.id && network.id !== networkDefaults.id &&
//     network.name && network.name !== networkDefaults.name
//   )
// }

export default function ChainEditForm ({ chain, existingChain = false }) {

  const [name, setChainName] = useState(chain.name || networkDefaults.name)
  const [chainId, setChainId] = useState(parseInt(chain.id) || networkDefaults.id)
  const [explorer, setExplorer] = useState(chain.explorer || networkDefaults.explorer)
  const [symbol, setSymbol] = useState(chain.symbol || networkDefaults.symbol)
  // const [isTestnet, setIsTestnet] = useState(chain.isTestnet || networkDefaults.isTestnet)
  // const [color, setColor] = useState(chain.color || networkDefaults.color)
  
  return (
    <>
      <div className='chainColorSwatches'>
        {[ 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'accent7', 'accent8'].map(color => {
          return (
            <div
              className={chain.color === color ? 'chainColorSwatch chainColorSwatchSelected' : 'chainColorSwatch'}
              style={{ background: `var(--${color})` }}
              onClick={() => {
                link.send('tray:action', 'setChainColor', chain.id, color)
              }}
            />
          )
        })}
      </div>

      <div className='chainRow'>
        <div className='chainName chainInputField'>
          <label htmlFor='chainName' className='chainInputLabel'>Chain Name</label>
          <input
            id='chainName'
            className={name === networkDefaults.name ? 'chainInput chainInputDim' : 'chainInput'}
            value={name}
            spellCheck='false'
            onChange={(e) => {
              setChainName(e.target.value)
            }}
            onFocus={(e) => {
              if (e.target.value === networkDefaults.name) setChainName('')
            }}
            onBlur={(e) => {
              if (e.target.value === '') setChainName(networkDefaults.name)
            }}
          />
        </div>
      </div>

      {!existingChain ? (
        <div className='chainRow'>
          <div className='chainName chainInputField'>
            <label htmlFor='chainId' className='chainInputLabel'>Chain ID</label>
            <input
              id='chainId'
              className={chainId === networkDefaults.id ? 'chainInput chainInputDim' : 'chainInput'}
              value={chainId}
              spellCheck='false'
              onChange={(e) => {
                if (Number(parseInt(e.target.value)) || e.target.value === '') {
                  setChainId(e.target.value)
                }
              }}
              onFocus={(e) => {
                if (e.target.value === networkDefaults.id) setChainId('')
              }}
              onBlur={(e) => {
                if (e.target.value === '') setChainId(networkDefaults.id)
              }}
            />
          </div>
        </div>
      ) : null}

      <div className='chainRow'>
        <div className='chainName chainInputField'>
          <label htmlFor='chainSymbol' className='chainInputLabel'>Native Symbol</label>
          <input
            id='chainSymbol'
            className={symbol === networkDefaults.symbol ? 'chainInput chainInputDim' : 'chainInput'}
            value={symbol}
            spellCheck='false'
            onChange={(e) => {
              if (e.target.value.length > 8) return e.preventDefault()
              setSymbol(e.target.value)
            }}
            onFocus={(e) => {
              if (e.target.value === networkDefaults.symbol) setSymbol('')
            }}
            onBlur={(e) => {
              if (e.target.value === '') setSymbol(networkDefaults.symbol)
            }}
          />
        </div>
      </div>

      <div className='chainRow'>
        <div className='chainExplorer chainInputField'>
          <label htmlFor='chainExplorer' className='chainInputLabel'>Block Explorer</label>
          <input
            id='chainExplorer'
            className={explorer === networkDefaults.explorer ? 'chainInput chainInputDim' : 'chainInput'}
            value={explorer}
            spellCheck='false'
            onChange={(e) => { 
              setExplorer(e.target.value) 
              
            }}
            onFocus={(e) => {
              if (e.target.value === networkDefaults.explorer) setExplorer('')
            }}
            onBlur={(e) => {
              if (e.target.value === '') setExplorer(networkDefaults.explorer)
            }}
          />
        </div>
      </div>

      {chainId !== 1 ? (
        <div className='chainRow chainRowTestnet'>
        <label id='testnet-label' className=''>Chain is Testnet?</label>
        <div id='testnetToggle' role='checkbox' aria-checked={chain.isTestnet} aria-labelledby='testnet-label'
            className={chain.isTestnet ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}
            onClick={() => {
              link.send('tray:action', 'updateNetwork', chain, updatedChain)
            }}
          >
            <div className='signerPermissionToggleSwitch' />
          </div>
        </div>
      ) : null}

      <div className='chainRow chainRowRemove'>
        <DangerousSubmitButton
          text='Remove Chain'
          handleClick={() => {
            const confirmAction = { view: 'notify', data: { notify: 'confirmRemoveChain', notifyData: { chain } } }
            link.send('tray:action', 'navDash', confirmAction)
          }}
        />
      </div>
    </>
  )
}
