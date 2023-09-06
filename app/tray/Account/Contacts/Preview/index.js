import React from 'react'
import styled from 'styled-components'
import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { matchFilter } from '../../../../../resources/utils'
import useStore from '../../../../../resources/Hooks/useStore'
import useAccountModule from '../../../../../resources/Hooks/useAccountModule'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

const ModuleHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    margin-top: 2px;
    margin-left: 12px;
  }
`

const DappsPreview = ({ filter = '', moduleId, account }) => {
  const [moduleRef] = useAccountModule(moduleId)

  return (
    <div className='balancesBlock' ref={moduleRef}>
      <div className='moduleHeader'>
        <ModuleHeaderTitle>
          {svg.contact(14)}
          <span>{'Contacts'}</span>
        </ModuleHeaderTitle>
        <span>{svg.expandArrows(14)}</span>
      </div>
      <div style={{ padding: '20px' }}>
        {'Newly interacted-with addresses the user may want to add to their contact list.'}
      </div>
    </div>
  )
}

export default DappsPreview
