import React, { useState } from 'react'

import link from '../../../../resources/link'
import Dropdown from '../../../../resources/Components/Dropdown'
import { DisabledSubmitButton, SubmitButton } from '../Button'

const networkDefaults = {
  id: 'Chain ID',
  name: 'Chain Name',
  explorer: 'Block Explorer',
  symbol: 'Native Symbol',
  isTestnet: false
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
    <SubmitButton
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
  const [isTestnet, setIsTestnet] = useState(chain.isTestnet || networkDefaults.isTestnet)

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

      <div className='chainRow'>
        <div className='chainExplorer chainInputField'>
          <label htmlFor='chainExplorer' className='chainInputLabel'>Chain Color</label>
          <Dropdown
            syncValue={chain.color}
            onChange={(value) => link.send('tray:action', 'setChainColor', chainId, value)}
            options={[
              { text: 'Color1', value: 'accent1', style: { color: 'var(--accent1)' } },
              { text: 'Color2', value: 'accent2', style: { color: 'var(--accent2)' } },
              { text: 'Color3', value: 'accent3', style: { color: 'var(--accent3)' } },
              { text: 'Color4', value: 'accent4', style: { color: 'var(--accent4)' } },
              { text: 'Color5', value: 'accent5', style: { color: 'var(--accent5)' } },
              { text: 'Color6', value: 'accent6', style: { color: 'var(--accent6)' } },
              { text: 'Color7', value: 'accent7', style: { color: 'var(--accent7)' } },
              { text: 'Color8', value: 'accent8', style: { color: 'var(--accent8)' } }
            ]}
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
        <label id='testnet-label' className='chainInputLabel'>Is Testnet?</label>
        <div id='testnetToggle' role='checkbox' aria-checked={isTestnet} aria-labelledby='testnet-label'
            className={isTestnet ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}
            onClick={() => setIsTestnet(!isTestnet)}
          >
            <div className='signerPermissionToggleSwitch' />
          </div>
      </div>

      <div className='chainRow'>
        <EditFormSubmitButton 
          labels={labels} 
          network={{
            id: chainId, name, explorer, symbol, isTestnet, type: chain.type
          }}
          onSubmit={onSubmit}
          validateSubmit={validateSubmit}
        />
      </div>
    </>
  )
}
