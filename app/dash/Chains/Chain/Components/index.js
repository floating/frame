import React, { useState } from 'react'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import RingIcon from '../../../../../resources/Components/RingIcon'
import chainDefault from '../chainDefault'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

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

export const EditChainField = ({ currentValue, defaultValue, label, onChange }) => {
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
        className={!currentValue ? 'chainInput chainInputDim' : 'chainInput'}
        value={currentValue || (!editing && defaultValue) || ''}
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

export const EditChainName = ({ currentName, onChange }) => (
  <EditChainField
    currentValue={currentName}
    onChange={onChange}
    label={'Chain Name'}
    defaultValue={chainDefault.name}
  />
)

export const EditChainSymbol = ({ currentSymbol, onChange }) => (
  <EditChainField
    currentValue={currentSymbol}
    onChange={onChange}
    label={'Native Symbol'}
    defaultValue={chainDefault.symbol}
  />
)

export const EditChainId = ({ chainId, onChange }) => (
  <EditChainField
    currentValue={chainId}
    onChange={onChange}
    label={'Chain ID'}
    defaultValue={chainDefault.id}
  />
)

export const EditChainExplorer = ({ currentExplorer, onChange }) => (
  <EditChainField
    currentValue={currentExplorer}
    onChange={onChange}
    label={'Block Explorer'}
    defaultValue={chainDefault.explorer}
  />
)

export const EditChainIcon = ({ currentIcon, onChange }) => (
  <EditChainField
    currentValue={currentIcon}
    onChange={onChange}
    label={'Chain Icon'}
    defaultValue={chainDefault.icon}
  />
)

export const EditNativeCurrencyIcon = ({ currentCurrencyIcon, onChange }) => (
  <EditChainField
    currentValue={currentCurrencyIcon}
    onChange={onChange}
    label={'Native Currency Icon'}
    defaultValue={chainDefault.nativeCurrencyIcon}
  />
)

export const EditNativeCurrencyName = ({ currentNativeCurrency, onChange }) => (
  <EditChainField
    currentValue={currentNativeCurrency}
    label='Native Currency Name'
    defaultValue={chainDefault.nativeCurrencyName}
    onChange={onChange}
  />
)

export const EditPrimaryRPC = ({ currentPrimaryRPC, onChange }) => (
  <EditChainField
    currentValue={currentPrimaryRPC}
    label={'Primary RPC'}
    defaultValue={chainDefault.primaryRpc}
    onChange={onChange}
  />
)

export const EditSecondaryRPC = ({ currentSecondaryRpc, onChange }) => (
  <EditChainField
    currentValue={currentSecondaryRpc}
    label={'Secondary RPC'}
    defaultValue={chainDefault.secondaryRpc}
    onChange={onChange}
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

const EnabledLaunchExplorerButton = ({ id, type }) => {
  const openExplorer = () => {
    link.rpc('openExplorer', { id, type }, () => {})
  }

  return (
    <ClusterValue role='button' onClick={openExplorer}>
      <div style={{ padding: '8px' }}>{svg.telescope(18)}</div>
    </ClusterValue>
  )
}

const DisabledLaunchExplorerButton = () => {
  return (
    <ClusterValue>
      <div style={{ color: 'var(--ghostD)', padding: '8px' }}>{svg.telescope(18)}</div>
    </ClusterValue>
  )
}

const LaunchExplorerButton = ({ id, type, explorer }) => {
  return explorer ? <EnabledLaunchExplorerButton id={id} type={type} /> : <DisabledLaunchExplorerButton />
}

const CurrentPrice = ({ symbol, price }) => {
  const localPrice = `$${price.toLocaleString()}`

  return (
    <ClusterValue grow={6}>
      <div className='chainCurrencyItemSymbol'>{symbol}</div>
      <div className='chainCurrencyItemAt'>{'@'}</div>
      <div className='sliceChainIdNumber'>{localPrice}</div>
    </ClusterValue>
  )
}

export const ChainFooter = ({ id, type, symbol, price, explorer }) => {
  return (
    <ClusterBox>
      <Cluster>
        <ClusterRow>
          <LaunchExplorerButton id={id} type={type} explorer={explorer} />
          <CurrentPrice symbol={symbol} price={price} />
        </ClusterRow>
      </Cluster>
    </ClusterBox>
  )
}
