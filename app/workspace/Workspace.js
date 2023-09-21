import styled from 'styled-components'
import useStore from '../../resources/Hooks/useStore.js'

// import link from '../../resources/link'

import Overlay from '../../resources/Components/Overlay'
import { Fluid } from '../../resources/Components/Fluid'

import Command from './Spaces/Command'
import Accounts from './Spaces/Accounts'
import Chains from './Spaces/Chains'
import Settings from './Spaces/Settings/App'
import Dapps from './Spaces/Dapps'
import Views from './Spaces/Views'
import Onboard from '../onboard/App'

import Ribbon from './Ribbon'
import Dock from './Spaces/Command/Dock/index.js'

const Splash = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 0;
  background: var(--ghostZ);
`

const Main = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
  color: var(--outerspace);
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-user-select: none;
  user-select: none;
  z-index: 9999;
  padding-top: 64px;
  /* border-top: 1px solid var(--ghostZ); */
`

const Space = ({ space, data }) => {
  if (space === 'command') {
    return <Command data={data} />
  } else if (space === 'dapp') {
    return (
      <SpaceWrap>
        <Views data={data} />
      </SpaceWrap>
    )
  } else if (space === 'settings') {
    return (
      <SpaceWrap>
        <Settings data={data} />
      </SpaceWrap>
    )
  } else if (space === 'onboard') {
    return (
      <SpaceWrap>
        <Onboard data={data} />
      </SpaceWrap>
    )
  } else if (space === 'chains') {
    return (
      <SpaceWrap>
        <Chains data={data} />
      </SpaceWrap>
    )
  } else if (space === 'dapps') {
    return (
      <SpaceWrap>
        <Dapps data={data} />
      </SpaceWrap>
    )
  } else if (space === 'accounts') {
    return (
      <SpaceWrap>
        <Accounts data={data} />
      </SpaceWrap>
    )
  } else {
    return (
      <div>
        {'view not found'}
        {view}
        <pre>{JSON.stringify(data, null, 4)}</pre>
      </div>
    )
  }
}

const SpaceWrap = styled.div`
  position: absolute;
  top: 0px;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto auto;
  padding: 128px 0px;
  overflow-y: scroll;
  overflow-x: hidden;
  max-width: 900px;
`

const TopHandle = styled.div`
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  height: 64px;
  z-index: 999999999; // Top z-index
  -webkit-app-region: drag;
  /* pointer-events: none; */
  background: red;
  display: none;
`

const ColorSwatches = styled.div`
  margin: 200px;
  display: flex;
`

const Swatch = styled.div`
  height: 80px;
  width: 80px;
`

export const TopBackdrop = styled.div`
  position: fixed;
  top: 0px;
  right: 0px;
  left: 0px;
  height: 60px;
  z-index: 99999;
  backdrop-filter: blur(8px);
  pointer-events: none;
  mask-image: linear-gradient(to bottom, black 32px, transparent);
  -webkit-mask-image: linear-gradient(to bottom, black 32px, transparent);
  display: none;

  &:after {
    content: '';
    position: absolute;
    inset: 0px;
    z-index: 1;
    background: linear-gradient(
      90deg,
      var(--ghostAZ) 5%,
      transparent 10%,
      transparent 90%,
      var(--ghostAZ) 95%
    );
  }
`

export const TopFade = styled.div`
  position: fixed;
  top: 0px;
  right: 0px;
  left: 0px;
  height: 60px;
  z-index: 199999;
  pointer-events: none;

  /* background: red; */
  background: linear-gradient(-180deg, var(--ghostZ) 0%, transparent 100%);

  &:after {
    content: '';
    position: absolute;
    inset: 0px;
    opacity: 0.8;
    background: linear-gradient(-180deg, var(--ghostZ) 25%, transparent 100%);
  }
`

export const BotBackdrop = styled.div`
  position: fixed;
  bottom: 0px;
  right: 0px;
  left: 0px;
  height: 60px;
  z-index: 99999;
  backdrop-filter: blur(8px);
  pointer-events: none;
  mask-image: linear-gradient(to top, black 32px, transparent);
  -webkit-mask-image: linear-gradient(to top, black 32px, transparent);
  display: none;

  &:after {
    content: '';
    position: absolute;
    inset: 0px;
    z-index: 1;
    background: linear-gradient(
      90deg,
      var(--ghostAZ) 5%,
      transparent 10%,
      transparent 90%,
      var(--ghostAZ) 95%
    );
  }
`

export const BotFade = styled.div`
  position: fixed;
  bottom: 0px;
  right: 0px;
  left: 0px;
  height: 60px;
  z-index: 199999;
  pointer-events: none;
  background: linear-gradient(0deg, var(--ghostZ) 0%, transparent 100%);

  &:after {
    content: '';
    position: absolute;
    inset: 0px;
    opacity: 0.8;
    background: linear-gradient(0deg, var(--ghostZ) 25%, transparent 100%);
  }
`

const Workspace = (props) => {
  const frameState = useStore('windows.workspaces', frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null
  return (
    <Splash>
      {/* <TopHandle /> */}
      {/* <Overlay /> */}
      <TopBackdrop />
      <BotBackdrop />
      <TopFade />
      <BotFade />
      <Fluid>
        {/* <Ribbon /> */}
        {/* <ColorSwatches>
          <Swatch style={{ background: 'var(--ghostX)' }} />
          <Swatch style={{ background: 'var(--ghostY)' }} />
          <Swatch style={{ background: 'var(--ghostZ)' }} />
          <Swatch style={{ background: 'var(--ghostAZ)' }} />
          <Swatch style={{ background: 'var(--ghostA)' }} />
          <Swatch style={{ background: 'var(--ghostB)' }} />
          <Swatch style={{ background: 'var(--ghostC)' }} />
          <Swatch style={{ background: 'var(--ghostD)' }} />
        </ColorSwatches> */}
        <Main>
          <Space space={nav.space} data={nav.data} />
        </Main>
      </Fluid>
    </Splash>
  )
}

export default Workspace
