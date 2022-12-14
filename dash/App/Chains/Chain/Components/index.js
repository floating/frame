import React, { useState } from 'react'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'

import chainDefault from '../chainDefault'

export const SubmitChainButton = ({ text, enabled, textColor, onClick }) => {
  return (
    <div
      role='button'
      className={enabled ? 'addTokenSubmit addTokenSubmitEnabled' : 'addTokenSubmit'}
      style={{ color: textColor }}
      onClick={onClick}
    >
      <span>{text}</span>
    </div>
  )
}

export const ChainHeader = ({ type, id, primaryColor, icon, svgName, name, on, showExpand, showToggle }) => {
  const isMainnet = id === 1
  return (
    <div className='signerTop'>
      <div className='signerDetails'>
        <div className='signerIcon'>
          <RingIcon color={`var(--${primaryColor})`} img={icon} svgName={svgName} />
        </div>
        {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
        <div role='chainName' className='signerName'>
          {name}
        </div>
      </div>
      <div className='signerMenuItems'>
        {showExpand && (
          <div
            className='signerExpand'
            onClick={() => {
              const chain = { id, type }
              link.send('tray:action', 'navDash', { view: 'chains', data: { selectedChain: chain } })
            }}
          >
            {svg.bars(14)}
          </div>
        )}
        {showToggle && (
          <div
            className={on ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}
            onClick={!isMainnet ? () => link.send('tray:action', 'activateNetwork', type, id, !on) : null}
          >
            {isMainnet ? (
              <div className='signerPermissionToggleSwitchLocked'>
                {svg.lock(10)}
                <div className='signerPermissionToggleSwitch' />
              </div>
            ) : (
              <div className='signerPermissionToggleSwitch' />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const accents = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'accent7', 'accent8']

export const EditChainColor = ({ currentColor, onChange }) => {
  return (
    <div className='chainRow'>
      <div className='chainInputLabel'>Chain Color</div>
      <div className='chainColorSwatches'>
        {accents.map((color) => (
          <div
            key={color}
            className={
              currentColor === color ? 'chainColorSwatch chainColorSwatchSelected' : 'chainColorSwatch'
            }
            style={{ background: `var(--${color})` }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  )
}

export const EditChainName = ({ currentName, onChange }) => {
  return (
    <div className='chainRow'>
      <label htmlFor='chainName' className='chainInputLabel'>
        Chain Name
      </label>
      <input
        id='chainName'
        className={currentName === chainDefault.name ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentName}
        spellCheck='false'
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          if (e.target.value === chainDefault.name) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(chainDefault.name)
        }}
      />
    </div>
  )
}

export const EditChainSymbol = ({ currentSymbol, onChange }) => {
  return (
    <div className='chainRow'>
      <label htmlFor='chainSymbol' className='chainInputLabel'>
        Native Symbol
      </label>
      <input
        id='chainSymbol'
        className={currentSymbol === chainDefault.symbol ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentSymbol}
        spellCheck='false'
        onChange={(e) => {
          if (e.target.value.length > 8) return e.preventDefault()
          onChange(e.target.value)
        }}
        onFocus={(e) => {
          if (e.target.value === chainDefault.symbol) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(chainDefault.symbol)
        }}
      />
    </div>
  )
}

export const EditChainId = ({ chainId, onChange }) => {
  return (
    <div className='chainRow'>
      <label htmlFor='chainId' className='chainInputLabel'>
        Chain ID
      </label>
      <input
        id='chainId'
        className={chainId === chainDefault.id ? 'chainInput chainInputDim' : 'chainInput'}
        value={chainId}
        spellCheck='false'
        onChange={(e) => {
          if (Number(parseInt(e.target.value)) || e.target.value === '') {
            onChange(e.target.value)
          }
        }}
        onFocus={(e) => {
          if (e.target.value === chainDefault.id) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(chainDefault.id)
        }}
      />
    </div>
  )
}

export const EditTestnet = ({ testnet, onChange }) => {
  return (
    <div className='chainRowTestnet'>
      <label>Testnet</label>
      <div
        role='chainTestnet'
        aria-checked={testnet}
        className={testnet ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'}
        onClick={() => onChange(!testnet)}
      >
        <div className='signerPermissionToggleSwitch' />
      </div>
    </div>
  )
}

export const EditChainExplorer = ({ currentExplorer, onChange }) => {
  return (
    <div className='chainRow'>
      <label htmlFor='chainExplorer' className='chainInputLabel'>
        Block Explorer
      </label>
      <input
        id='chainExplorer'
        className={currentExplorer === chainDefault.explorer ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentExplorer}
        spellCheck='false'
        onChange={(e) => {
          onChange(e.target.value)
        }}
        onFocus={(e) => {
          if (e.target.value === chainDefault.explorer) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(chainDefault.explorer)
        }}
      />
    </div>
  )
}

export const EditRPC = ({ currentRPC, label, rpcDefault = 'RPC Endpoint', onChange }) => {
  const [editing, setEditing] = useState(false)
  const id = label
    .split(' ')
    .map((s) => s.toLowerCase())
    .join('-')

  return (
    <div className='chainRow'>
      <label htmlFor={id} className='chainInputLabel'>
        {label}
      </label>
      <input
        id={id}
        className={!currentRPC ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentRPC || (!editing && rpcDefault) || ''}
        spellCheck='false'
        onChange={(e) => {
          onChange(e.target.value)
        }}
        onFocus={() => {
          setEditing(true)
        }}
        onBlur={() => {
          setEditing(false)
        }}
      />
    </div>
  )
}

export const ChainFooter = ({ symbol, price }) => {
  return (
    <div className='chainFooter'>
      <div className='chainCurrencyItem'>
        <div className='chainCurrencyItemSymbol'>{symbol}</div>
        <div className='chainCurrencyItemAt'>{'@'}</div>
        <div className='sliceChainIdNumber'>{'$' + price.toLocaleString() + ''}</div>
      </div>
    </div>
  )
}
