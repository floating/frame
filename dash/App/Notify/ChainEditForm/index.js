import React, { useState } from 'react'
import { DisabledSubmitButton, SubmitButton } from '../Button'

const networkDefaults = {
  id: 'Chain ID',
  type: 'ethereum',
  name: 'Chain Name',
  explorer: 'Block Explorer',
  primaryRpc: 'Primary Endpoint',
  secondaryRpc: 'Secondary Endpoint',
  symbol: 'Native Symbol',
  layer: 'other'
}

function isNetworkReady (network) {
  return (
    network.id && network.id !== networkDefaults.id &&
    network.name && network.name !== networkDefaults.name
  )
}

export default function ChainEditForm ({ chain, labels, onSubmit, invalidateSubmit = () => {}, existingChain = false }) {
  const rpcUrls = chain.rpcUrls || []
    
  const [name, setChainName] = useState(chain.name || networkDefaults.name)
  const [chainId, setChainId] = useState(parseInt(chain.id) || networkDefaults.id)
  const [explorer, setExplorer] = useState(chain.explorer || networkDefaults.explorer)
  const [primaryRpc, setPrimaryRpc] = useState(rpcUrls[0] || networkDefaults.primaryRpc)
  const [secondaryRpc, setSecondaryRpc] = useState(rpcUrls[1] || networkDefaults.secondaryRpc)
  const [symbol, setSymbol] = useState(chain.symbol || networkDefaults.symbol)
  const [layer, setLayer] = useState(chain.layer || networkDefaults.layer)
  const [submitted, setSubmitted] = useState(false)

  const submitButton = () => {
    const network = {
      id: chainId, name, explorer, symbol, layer, primaryRpc, secondaryRpc, type: chain.type
    }

    if (submitted) {
      return <DisabledSubmitButton text={labels.submitted} />
    }

    if (!isNetworkReady(network)) {
      return <DisabledSubmitButton text={'Fill in Chain'} />
    }

    // returns text if submit is not valid and should not be enabled
    const warningText = invalidateSubmit(network)
    if (warningText) {
      return <DisabledSubmitButton text={warningText} />
    }

    return (
      <SubmitButton
        handleClick={() => {
          setSubmitted(true)
          onSubmit(network)
        }}
        text={labels.submit}
      />
    )
  }

  return (
    <div className='notifyBoxWrap' onMouseDown={e => e.stopPropagation()}>
      <div className='notifyBoxSlide'>
        <div role='title' className='addChainTitle'>{labels.title}</div>

        <div className='addChain'>
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
        </div>


        <div className='chainRow'>
          <div className='chainId chainInputField'>
            {
              existingChain
                ? <>
                    <div className='chainInputLabel'>Chain ID</div>
                    <div className='chainFieldDisplay'>{chainId}</div>
                  </>
                : <>
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
                  </>
            }
          </div>

          <div className='chainSymbol chainInputField'>
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
              onChange={(e) => { setExplorer(e.target.value) }}
              onFocus={(e) => {
                if (e.target.value === networkDefaults.explorer) setExplorer('')
              }}
              onBlur={(e) => {
                if (e.target.value === '') setExplorer(networkDefaults.explorer)
              }}
            />
          </div>
        </div>

        <div className='chainRow'>
          <div className='chainExplorer chainInputField'>
            <label htmlFor='primaryRpc' className='chainInputLabel'>Primary RPC</label>
            <input
              id='primaryRpc'
              className={primaryRpc === networkDefaults.primaryRpc ? 'chainInput chainInputDim' : 'chainInput'}
              value={primaryRpc}
              spellCheck='false'
              onChange={(e) => {
                setPrimaryRpc(e.target.value)
              }}
              onFocus={(e) => {
                if (e.target.value === networkDefaults.primaryRpc) setPrimaryRpc('')
              }}
              onBlur={(e) => {
                if (e.target.value === '') setPrimaryRpc(networkDefaults.primaryRpc)
              }}
            />
          </div>
        </div>

        <div className='chainRow'>
          <div className='chainExplorer chainInputField'>
            <label htmlFor='secondaryRpc' className='chainInputLabel'>Secondary RPC</label>
            <input
              id='secondaryRpc'
              className={secondaryRpc === networkDefaults.secondaryRpc ? 'chainInput chainInputDim' : 'chainInput'}
              value={secondaryRpc}
              spellCheck='false'
              onChange={(e) => {
                setSecondaryRpc(e.target.value)
              }}
              onFocus={(e) => {
                if (e.target.value === networkDefaults.secondaryRpc) setSecondaryRpc('')
              }}
              onBlur={(e) => {
                if (e.target.value === '') setSecondaryRpc(networkDefaults.secondaryRpc)
              }}
            />
          </div>
        </div>

        <div className='chainRow'>
          <div className='chainLayers chainInputField'>
            <div role='label' className='chainInputLabel'>Chain Type</div>
            <div role='radiogroup' className='chainLayerOptions'>
              <div
                role='radio'
                aria-checked={layer === 'rollup'}
                className={layer === 'rollup' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                onMouseDown={() => setLayer('rollup')}
              >Rollup</div>
              <div
                role='radio'
                aria-checked={layer === 'sidechain'}
                className={layer === 'sidechain' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                onMouseDown={() => setLayer('sidechain')}
              >Sidechain</div>
              <div
                role='radio'
                aria-checked={layer === 'testnet'}
                className={layer === 'testnet' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                onMouseDown={() => setLayer('testnet')}
              >Testnet</div>
              <div
                role='radio'
                aria-checked={layer === 'other'}
                className={layer === 'other' ?  'chainLayerOption chainLayerOptionOn' : 'chainLayerOption'}
                onMouseDown={() => setLayer('other')}
              >Other</div>
            </div>
          </div>
        </div>

        <div className='chainRow'>{submitButton()}</div>
      </div>
    </div>
  )
}
