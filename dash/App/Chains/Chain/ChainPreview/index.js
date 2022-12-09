import React from 'react'
import { ChainHeader, ChainFooter } from '../Components'
import Connection from '../Connection'
import Gas from '../../../../../resources/Components/Gas'

export default (props) => {
  const { type, id, primaryColor, icon, name, on, connection, symbol, price } = props
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
          <ChainFooter symbol={symbol} price={price} />
          <div style={{ height: '14px' }} />
        </div>
      )}
    </div>
  )
}
