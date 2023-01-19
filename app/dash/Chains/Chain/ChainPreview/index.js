import React from 'react'
import { ChainHeader, ChainFooter } from '../Components'
import Connection from '../Connection'
import Gas from '../../../../../resources/Components/Gas'

export default (props) => {
  const { type, id, primaryColor, icon, name, on, symbol, price } = props
  return (
    <div className='network'>
      <ChainHeader
        type={type}
        id={id}
        primaryColor={primaryColor}
        icon={icon}
        name={name}
        on={on}
        showExpand={true}
        showToggle={true}
      />
      {on && (
        <div className='chainModules'>
          <Connection {...props} />
          <Gas chainId={id} />
          <ChainFooter id={id} type={type} symbol={symbol} price={price} />
          <div style={{ height: '14px' }} />
        </div>
      )}
    </div>
  )
}
