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
  pointer-events: none;
`

const Workspace = (props) => {
  const frameState = useStore('windows.workspaces', frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null
  return (
    <Splash>
      <TopHandle />
      <Overlay />
      <Fluid>
        <Ribbon />
        <Main>
          <Space space={nav.space} data={nav.data} />
        </Main>
      </Fluid>
    </Splash>
  )
}

export default Workspace
