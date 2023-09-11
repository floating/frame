import styled from 'styled-components'

import Native from './Native'
import Account from './Account'

import link from '../../../resources/link'
import svg from '../../../resources/svg'
import useStore from '../../../resources/Hooks/useStore'

const Ribbon = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  left: 12px;
  height: 36px;
  z-index: 999999;
  pointer-events: auto;
  align-items: center;
  text-align: center;
  display: flex;
  justify-content: space-between;
  transform: translate3d(0, 0, 0);
`

const RibbonSection = styled.div`
  height: 32px;
  border-radius: 12px;
  overflow: hidden;
  z-index: 999999;
  background: var(--ghostAZ);
  opacity: 1;
  border-bottom: 1px solid var(--ghostZ);
  box-shadow: 0px 2px 8px -2px var(--ghostY), 0px -3px 6px -2px var(--ghostB);
  display: flex;
`

const Options = styled.div`
  font-size: 13px;
  font-weight: 400;
  display: flex;
  height: 100%;
`
const OptionButton = styled.div`
  width: 64px;
  height: 100%;
  border-left: 1px solid var(--ghostZ);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
  * {
    pointer-events: none;
  }
  &:hover {
    background: var(--ghostA);
  }
`

export const TopBackdrop = styled.div`
  position: fixed;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  height: 120px;
  z-index: 99999;
  backdrop-filter: blur(8px);
  pointer-events: none;
  mask-image: linear-gradient(to bottom, black 32px, transparent);
  -webkit-mask-image: linear-gradient(to bottom, black 32px, transparent);

  &:after {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    z-index: 1;
    background: linear-gradient(90deg, var(--ghostZ) 5%, transparent 10%, transparent 90%, var(--ghostZ) 95%);
  }
`

export const TopFade = styled.div`
  position: fixed;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
  height: 120px;
  z-index: 199999;
  pointer-events: none;

  /* background: red; */
  background: linear-gradient(-180deg, var(--ghostY) 0%, transparent 100%);

  &:after {
    content: '';
    position: absolute;
    inset: 0px;
    opacity: 0.8;
    background: linear-gradient(-180deg, var(--ghostZ) 25%, transparent 100%);
  }
`

const NavigationContainer = styled.div`
  z-index: 9999;
  display: flex;
  height: 40px;
  width: 80px;
`
const NavBack = styled.div`
  height: 26px;
  width: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin: 8px 0px;
  border-radius: 7px;
  -webkit-app-region: no-drag;
  &:hover {
    background: var(--ghostB);
    box-shadow: 1px 1px 4px var(--ghostZ), -1px -1px 4px var(--ghostA);
  }
  * {
    pointer-events: none;
  }
`

const RibbonCenter = styled.div`
  display: flex;
  margin: 4px 0px 0px 0px;
  > * {
    margin: 0 4px;
  }
`

const Navigation = () => {
  return (
    <NavigationContainer>
      <NavBack
        onClick={() => {
          link.send('workspace:nav:back', window.frameId)
        }}
      >
        {svg.chevronLeft(14)}
      </NavBack>
      <NavBack
        onClick={() => {
          link.send('workspace:nav:forward', window.frameId)
        }}
      >
        <span style={{ transform: 'rotate(180deg)' }}>{svg.chevronLeft(14)}</span>
      </NavBack>
    </NavigationContainer>
  )
}

export default () => {
  const frameState = useStore('windows.workspaces', frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null

  const { space } = nav

  const platform = useStore('platform')

  return (
    <>
      <Ribbon>
        <Navigation platform={platform} />
        <RibbonCenter>
          <RibbonSection>
            <Account />
            <OptionButton
              onClick={() => {
                link.send('workspace:nav', window.frameId, 'accounts')
              }}
            >
              <span style={{ transform: 'rotate(180deg)' }}>{svg.chevron(24)}</span>
            </OptionButton>
          </RibbonSection>
          <RibbonSection>
            <Options>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'accounts')
                }}
              >
                {svg.accounts(14)}
              </OptionButton>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'chains')
                }}
              >
                {svg.chain(16)}
              </OptionButton>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'dapps')
                }}
              >
                {svg.window(13)}
              </OptionButton>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'settings')
                }}
              >
                {svg.settings(14)}
              </OptionButton>
            </Options>
          </RibbonSection>
        </RibbonCenter>
        <Native />
      </Ribbon>
      <TopBackdrop />
      <TopFade />
    </>
  )
}
