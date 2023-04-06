import styled from 'styled-components'
import { useState } from 'react'

import link from '../../../link'
import { capitalize } from '../../../utils'
import svg from '../../../svg'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../Cluster'

const NotifyTop = styled.div`
  padding: 24px 0px 16px 0px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const NotifyMain = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 14.6px;
  line-height: 22px;
  font-weight: 400;
`

const NotifyPrompt = styled.div`
  padding: 24px;
  font-weight: 400;
  text-transform: uppercase;
`

const ExtensionId = styled.div`
  margin: 24px 16px;
  height: 13px;
  font-weight: 400;
  text-transform: uppercase;
  display: flex;
  flex-direction: column;
  justify-content: center;
  letter-spacing: 0.5px;
  color: var(--moon);
`

const VCR = styled.div`
  font-family: 'FiraCode';
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0px;
`

const ConfirmButton = styled.div`
  padding: 24px;
  font-weight: 400;
  text-transform: uppercase;
  font-size: 16px;
`

const ExtensionConnectNotification = ({ id, browser, onClose }) => {
  const respond = (accepted) => link.rpc('respondToExtensionRequest', id, accepted, onClose)
  const browserName = capitalize(browser)
  const [copyId, setCopyId] = useState(false)

  return (
    <div className='notify cardShow'>
      <div className='notifyBoxWrap' onMouseDown={(e) => e.stopPropagation()}>
        <div className='notifyBoxSlide'>
          <ClusterBox>
            <NotifyTop>
              <div style={{ color: 'var(--moon)' }}>{svg.firefox(40)}</div>
            </NotifyTop>
            <Cluster>
              <ClusterRow>
                <ClusterValue>
                  <NotifyMain>
                    <div style={{ paddingBottom: '24px' }}>
                      {`A new ${browserName} extension is attempting to connect as "Frame Companion"`}{' '}
                    </div>
                    <div>{`If you did not recently add Frame Companion please verify the extension origin below`}</div>
                  </NotifyMain>
                </ClusterValue>
              </ClusterRow>
              <ClusterRow>
                <ClusterValue
                  onClick={() => {
                    link.send('tray:clipboardData', id)
                    setCopyId(true)
                    setTimeout(() => setCopyId(false), 2000)
                  }}
                >
                  <ExtensionId>{copyId ? 'extension origin copied' : <VCR>{id}</VCR>}</ExtensionId>
                </ClusterValue>
              </ClusterRow>
              <ClusterRow>
                <ClusterValue>
                  <NotifyPrompt>Allow this extension to connect?</NotifyPrompt>
                </ClusterValue>
              </ClusterRow>
              <ClusterRow>
                <ClusterValue onClick={() => respond(false)}>
                  <ConfirmButton style={{ color: 'var(--bad)' }}>Decline</ConfirmButton>
                </ClusterValue>
                <ClusterValue onClick={() => respond(true)}>
                  <ConfirmButton style={{ color: 'var(--good)' }}>Accept</ConfirmButton>
                </ClusterValue>
              </ClusterRow>
            </Cluster>
          </ClusterBox>
        </div>
      </div>
    </div>
  )
}

export default ExtensionConnectNotification
