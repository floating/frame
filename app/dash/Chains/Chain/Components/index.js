import React, { useState } from 'react'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'
import { capitalize } from '../../../../../resources/utils'

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

const EditChainProperty = ({ currentValue, onChange, valueName, title }) => {
  const id = `chain${capitalize(valueName)}`
  return (
    <div className='chainRow'>
      <label htmlFor={id} className='chainInputLabel'>
        {title}
      </label>
      <input
        id={id}
        className={currentValue === chainDefault[valueName] ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentValue}
        spellCheck='false'
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          if (e.target.value === chainDefault[valueName]) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(chainDefault[valueName])
        }}
      />
    </div>
  )
}

export const EditChainName = ({ currentName, onChange }) => (
  <EditChainProperty currentValue={currentName} onChange={onChange} title={'Chain Name'} valueName={'name'} />
)

export const EditChainSymbol = ({ currentSymbol, onChange }) => (
  <EditChainProperty
    currentValue={currentSymbol}
    onChange={onChange}
    title={'Native Symbol'}
    valueName={'symbol'}
  />
)

export const EditChainId = ({ chainId, onChange }) => (
  <EditChainProperty currentValue={chainId} onChange={onChange} title={'Chain ID'} valueName={'id'} />
)

export const EditChainExplorer = ({ currentExplorer, onChange }) => (
  <EditChainProperty
    currentValue={currentExplorer}
    onChange={onChange}
    title={'Block Explorer'}
    valueName={'explorer'}
  />
)
//TODO: needs to show an error when not a valid URL...
export const EditChainIcon = ({ currentIcon, onChange }) => (
  <EditChainProperty currentValue={currentIcon} onChange={onChange} title={'Chain Icon'} valueName={'icon'} />
)

export const EditNativeCurrencyName = ({ currentNativeCurrency, onChange }) => (
  <EditChainProperty
    currentValue={currentNativeCurrency}
    onChange={onChange}
    title={'Native Currency Name'}
    valueName={'nativeCurrencyName'}
  />
)

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
