import React from 'react'
import { ChainHeader } from '../Components'
import Connection from '../Connection'
import Gas from '../../../../../resources/Components/Monitor'
import { ClusterBox, Cluster } from '../../../../../resources/Components/Cluster'

export default (props) => {
  const { type, id, primaryColor, icon, name, on, explorer, symbol, price } = props
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
          <ClusterBox>
            <Cluster>
              <Connection {...props} />
              <Gas chainId={id} />
            </Cluster>
          </ClusterBox>
          <div style={{ height: '14px' }} />
        </div>
      )}
    </div>
  )
}
