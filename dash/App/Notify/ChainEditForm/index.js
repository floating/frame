import React, { useState } from 'react'

import link from '../../../../resources/link'
import { DisabledSubmitButton, GoodSubmitButton } from '../Button'

const networkDefaults = {
  id: 'Chain ID',
  name: 'Chain Name',
  explorer: 'Block Explorer',
  symbol: 'Native Symbol',
  layer: 'other'
}

function isNetworkReady (network) {
  return (
    network.id && network.id !== networkDefaults.id &&
    network.name && network.name !== networkDefaults.name
  )
}

const EditFormSubmitButton = ({ network, labels, onSubmit, validateSubmit }) => {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return <DisabledSubmitButton text={labels.submitted} />
  }

  if (!isNetworkReady(network)) {
    return <DisabledSubmitButton text='Fill in Chain' />
  }

  // returns text if submit is not valid and should not be enabled
  const { message, valid } = validateSubmit(network)
  if (!valid) {
    return <DisabledSubmitButton text={message} />
  }

  return (
    <GoodSubmitButton
      handleClick={() => {
        setTimeout(() => {
          link.send('tray:action', 'backDash')
        }, 400)

        setSubmitted(true)
        onSubmit(network)
      }}
      text={labels.submit}
    />
  )
}

export default function ChainEditForm ({
  chain,
  labels,
  onSubmit,
  existingChain = false,
  validateSubmit = () => ({ valid: true }),
  children: additionalFields = [] })
{
  const [name, setChainName] = useState(chain.name || networkDefaults.name)
  const [chainId, setChainId] = useState(parseInt(chain.id) || networkDefaults.id)
  const [explorer, setExplorer] = useState(chain.explorer || networkDefaults.explorer)
  const [symbol, setSymbol] = useState(chain.symbol || networkDefaults.symbol)
  const [layer, setLayer] = useState(chain.layer || networkDefaults.layer)
  
  return (
    <>
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

      {
        additionalFields.map((field, i) => {
          return (
            <div key={i} className='chainRow'>{field}</div>
          )
        })
      }

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

      <div className='chainRow'>
        <EditFormSubmitButton 
          labels={labels} 
          network={{
            id: chainId, name, explorer, symbol, layer, type: chain.type
          }}
          onSubmit={onSubmit}
          validateSubmit={validateSubmit}
        />
      </div>
    </>
  )
}
