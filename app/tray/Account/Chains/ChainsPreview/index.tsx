import React, { useState } from 'react'
import useStore from '../../../../../resources/Hooks/useStore'
import useAccountModule from '../../../../../resources/Hooks/useAccountModule'

import svg from '../../../../../resources/svg'

import Monitor from '../../../../../resources/Components/Monitor'
import { Cluster } from '../../../../../resources/Components/Cluster'

import type { Chain } from '../../../../../main/store/state/types'

const Mon = Monitor as any
type ChainsPreviewProps = {
  account: string
  // TODO: export module id from account module props type
  // moduleId: number
}

const ChainsPreview = ({ account }: ChainsPreviewProps) => {
  const [moduleRef] = useAccountModule(1)
  const [index, setIndex] = useState(1)

  const { address } = useStore('main.accounts', account)
  const ethereumChains = (useStore('main.networks.ethereum') || {}) as Record<number, Chain>

  const existingChainIds = Object.entries(ethereumChains)
    .filter(([_chainId, { on }]) => !!on)
    .map(([chainId]) => chainId)

  const currentChainId = existingChainIds[index] || '1'
  const currentChain = useStore('main.networks.ethereum', currentChainId)
  const currentChainMeta = useStore('main.networksMeta.ethereum', currentChainId)

  if (!currentChain || !currentChainMeta) return null

  const setChainIndex = (newIndex: number) => {
    if (newIndex > existingChainIds.length - 1) {
      setIndex(0)
    } else if (newIndex < 0) {
      setIndex(existingChainIds.length)
    } else {
      setIndex(newIndex)
    }
  }

  const { name } = currentChain
  const { primaryColor } = currentChainMeta

  return (
    <div className='balancesBlock' ref={moduleRef}>
      <div className='moduleHeader'>
        <span style={{ marginLeft: '-2px' }}>{svg.chain(16)}</span>
        <span>{`${name} Monitor`}</span>
        {existingChainIds.length > 1 && (
          <div className='chainMonitorSwitch'>
            <div className='chainMonitorSwitchButton' onClick={() => setChainIndex(index - 1)}>
              <div style={{ padding: '0px' }}>
                <div style={{ transform: 'rotate(-90deg)' }}>{svg.chevron(22)}</div>
              </div>
            </div>
            <div className='chainMonitorSwitchButton' onClick={() => setChainIndex(index + 1)}>
              <div style={{ padding: '0px' }}>
                <div style={{ transform: 'rotate(90deg)' }}>{svg.chevron(22)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Cluster>
        <Mon address={address} chainId={currentChain.id} color={`var(--${primaryColor})`} />
      </Cluster>
    </div>
  )
}

export default ChainsPreview
