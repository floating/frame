import svg from '../../../../../resources/svg'
import styled from 'styled-components'
import link from '../../../../../resources/link'

const Dock = styled.div`
  position: fixed;
  height: 64px;
  bottom: 16px;
  border-radius: 16px;
  background: var(--ghostA);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 8px;
`

const DappRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const DappIcon = styled.div`
  width: 42px;
  height: 42px;
  margin: 16px 4px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--ghostB);
  border-radius: 8px;

  * {
    pointer-events: none;
  }

  &:hover {
    background: var(--ghostC);
    transform: scale(1.2);
    transition: transform 0.2s ease-in-out;
  }
`

const DappIconBreak = styled.div`
  width: 3px;
  height: 42px;
  background: var(--ghostZ);
  border-radius: 1.5px;
  margin: 0px 8px;
`

export default () => {
  return (
    <Dock>
      <DappIcon
        onClick={() => {
          // updateNavData
          link.send('workspace:nav:update:data', window.frameId, { station: 'command' })
        }}
      >
        {'C'}
      </DappIcon>
      <DappIcon
        onClick={() => {
          // updateNavData
          link.send('workspace:nav:update:data', window.frameId, { station: 'dashboard' })
        }}
      >
        {'D'}
      </DappIcon>
      <DappIconBreak />
      <DappIcon
        onClick={() => {
          link.send('workspace:nav:update:data', window.frameId, { station: 'dapp' })
          link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
        }}
      >
        {svg.send(15)}
      </DappIcon>
      <DappIcon>{'-'}</DappIcon>
      <DappIcon>{'-'}</DappIcon>
      <DappIcon>{'-'}</DappIcon>
      <DappIcon>{'-'}</DappIcon>
      <DappIcon>{'-'}</DappIcon>
    </Dock>
  )
}
