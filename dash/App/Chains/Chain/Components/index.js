import React, { useState } from 'react'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'

const networkDefaults = {
  type: 'ethereum',
  id: 'Chain ID',
  name: 'Chain Name',
  explorer: 'Block Explorer',
  symbol: 'Native Symbol',
  isTestnet: false,
  color: 'accent3'
}

export const ChainHeader = ({ type, id, primaryColor, icon, svgName, name, on, showExpand, showToggle }) => {
  return (
    <div className='signerTop'>
      <div className='signerDetails'>
        <div className='signerIcon'>
          <RingIcon 
            color={`var(--${primaryColor})`}
            img={icon}
            svgName={svgName}
          />
        </div>
        {/* <div className='signerType' style={this.props.inSetup ? {top: '21px'} : {top: '24px'}}>{this.props.model}</div> */}
        <div className='signerName'>
          {name}
        </div>
      </div>
      <div className='signerMenuItems'>
        {showExpand ? (
          <div className='signerExpand' onClick={() => {
            const chain = { id, type }
            link.send('tray:action', 'navDash', { view: 'chains', data: { selectedChain: chain } })
          }}>
            {svg.bars(14)}
          </div>
        ) : null}
        {showToggle ? <div 
          className={on ? 'signerPermissionToggle signerPermissionToggleOn' : 'signerPermissionToggle'} 
          onClick={id !== 1 ? () => link.send('tray:action', 'activateNetwork', type, id, !on) : null}
        >
          {id === 1 ? (
            <div className='signerPermissionToggleSwitchLocked'>
              {svg.lock(10)}
              <div className='signerPermissionToggleSwitch' />
            </div>
          ) : (
            <div className='signerPermissionToggleSwitch' />
          )}
        </div> : null}
      </div>
    </div>
  )
}

export const EditChainColor = ({currentColor, onChange}) => {
  return (
    <div className='chainRow'>
      <div className='chainInputLabel'>Chain Color</div>
      <div className='chainColorSwatches'>
        {[ 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'accent7', 'accent8'].map(color => {
          return (
            <div
              key={color}
              className={currentColor === color ? 'chainColorSwatch chainColorSwatchSelected' : 'chainColorSwatch'}
              style={{ background: `var(--${color})` }}
              onClick={() => onChange(color)}
            />
          )
        })}
      </div>
    </div>
  )
}

export const EditChainName = ({currentName, onChange}) => {
  return (
    <div className='chainRow'>
      <label htmlFor='chainName' className='chainInputLabel'>Chain Name</label>
      <input
        id='chainName'
        className={currentName === networkDefaults.name ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentName}
        spellCheck='false'
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          if (e.target.value === networkDefaults.name) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(networkDefaults.name)
        }}
      />
    </div>
  )
}

export const EditChainSymbol = ({ currentSymbol, onChange }) => {
  return (
    <div className='chainRow'>
      <label htmlFor='chainSymbol' className='chainInputLabel'>Native Symbol</label>
      <input
        id='chainSymbol'
        className={currentSymbol === networkDefaults.symbol ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentSymbol}
        spellCheck='false'
        onChange={(e) => {
          if (e.target.value.length > 8) return e.preventDefault()
          onChange(e.target.value)
        }}
        onFocus={(e) => {
          if (e.target.value === networkDefaults.symbol) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(networkDefaults.symbol)
        }}
      />
    </div>
  )
}

export const EditChainId = ({ chainId, onChange }) => {
  return (
    <div className='chainRow'>
      <label htmlFor='chainId' className='chainInputLabel'>Chain ID</label>
      <input
        id='chainId'
        className={chainId === networkDefaults.id ? 'chainInput chainInputDim' : 'chainInput'}
        value={chainId}
        spellCheck='false'
        onChange={(e) => {
          if (Number(parseInt(e.target.value)) || e.target.value === '') {
            onChange(e.target.value)
          }
        }}
        onFocus={(e) => {
          if (e.target.value === networkDefaults.id) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(networkDefaults.id)
        }}
      />
    </div>
  )
}

export const EditTestnet = ({ testnet, onChange }) => {
  return (
    <div className='chainRow chainRowTestnet'>
      <label id='testnet-label' className=''>Is this chain a testnet?</label>
      <div id='testnetToggle' role='checkbox' aria-checked={testnet} aria-labelledby='testnet-label'
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
      <label htmlFor='chainExplorer' className='chainInputLabel'>Block Explorer</label>
      <input
        id='chainExplorer'
        className={currentExplorer === networkDefaults.explorer ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentExplorer}
        spellCheck='false'
        onChange={(e) => { 
          onChange(e.target.value) 
        }}
        onFocus={(e) => {
          if (e.target.value === networkDefaults.explorer) onChange('')
        }}
        onBlur={(e) => {
          if (e.target.value === '') onChange(networkDefaults.explorer)
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