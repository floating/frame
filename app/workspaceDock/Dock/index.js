import svg from '../../../resources/svg'
import styled, { createGlobalStyle } from 'styled-components'
import link from '../../../resources/link'
import useStore from '../../../resources/Hooks/useStore.js'
import { useState, useEffect } from 'react'

const GlobalStyle = createGlobalStyle`
  body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0px;
    font-family: 'MainFont';
    font-weight: 400;
    color: var(--outerspace);
  }
`

const Dock = styled.div`
  border-radius: 16px;
  background: var(--ghostA);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0px 12px 12px;
`

const DappRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const DappIcon = styled.div`
  width: 42px;
  height: 42px;
  margin-right: 12px;
  /* margin: 0px 2px 2px 12px; */
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
  margin: 0px 12px 0px 8px;
`
const DockWrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: ${({ hide }) => (hide ? 'translateY(100px)' : 'translateY(0)')};
  transition: transform 0.4s ease-in-out;
`

const Wrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`

const DockHandle = styled.div`
  position: absolute;
  left: 50%;
  bottom: 2px;
  height: 4px;
  width: 32px;
  margin-left: -16px;
  border-radius: 2px;
  background: var(--outerspace);
  display: none;
`

const RoundedElement = styled.div`
  position: absolute;
  left: 8px;
  bottom: 8px;

  width: 5px;
  height: 5px;
  background-color: var(--ghostAZ); /* Your actual background color */

  /* The mask */
  -webkit-mask-box-image: radial-gradient(circle at top right, transparent 0% 5px, black 5px);
  mask-box-image: radial-gradient(circle at top right, transparent 0% 5px, black 5px);
`

const RoundedElementRight = styled.div`
  position: absolute;
  right: 8px;
  bottom: 8px;

  width: 5px;
  height: 5px;
  background-color: var(--ghostAZ); /* Your actual background color */

  /* The mask */
  -webkit-mask-box-image: radial-gradient(circle at top left, transparent 0% 5px, black 5px);
  mask-box-image: radial-gradient(circle at top left, transparent 0% 5px, black 5px);
`
let hideTimeout
export default () => {
  const frameState = useStore('windows.workspaces', window.frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null

  const [hideDockWrap, setHideDockWrap] = useState(false)

  const setHide = () => {
    setHideDockWrap(true)
    clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => {
      link.send('workspace:nav:update:data', window.frameId, { hidden: true })
    }, 500)
  }

  const setShow = () => {
    clearTimeout(hideTimeout)
    setHideDockWrap(false)
    link.send('workspace:nav:update:data', window.frameId, { hidden: false })
  }

  const hidden = (nav.space === 'dapp' && hideDockWrap) || (nav.space !== 'dapp' && nav.space !== 'command')

  return (
    <Wrap onMouseEnter={() => setShow()}>
      <GlobalStyle />
      <RoundedElement />
      <RoundedElementRight />
      <DockHandle />
      <DockWrap
        hide={hidden}
        onMouseLeave={() => {
          setHide()
        }}
      >
        <Dock>
          <DappIcon
            onClick={() => {
              link.send('workspace:nav', window.frameId, 'command', { station: 'command' })
            }}
          >
            {'C'}
          </DappIcon>
          <DappIcon
            onClick={() => {
              link.send('workspace:nav', window.frameId, 'command', { station: 'dashboard' })
            }}
          >
            {'D'}
          </DappIcon>
          <DappIconBreak />
          <DappIcon
            onClick={() => {
              // link.send('workspace:nav:update:data', window.frameId, { station: 'dapp' })
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
      </DockWrap>
    </Wrap>
  )
}
