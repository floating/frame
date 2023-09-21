import styled, { keyframes, createGlobalStyle } from 'styled-components'

import Native from './Native'
import Account from './Account'

import link from '../../../resources/link'
import svg from '../../../resources/svg'
import useStore from '../../../resources/Hooks/useStore'

// const GlobalStyle = createGlobalStyle`
//   body {
//     width: 100%;
//     height: 100%;
//     margin: 0;
//     padding: 0px;
//     font-family: 'MainFont';
//     font-weight: 400;
//     color: var(--outerspace);
//   }
// `

const Ribbon = styled.div`
  /* position: absolute;
  top: 0px;
  right: 0px;
  left: 0px; */
  height: 32px;
  width: 100%;
  z-index: 999999;
  pointer-events: auto;
  align-items: center;
  text-align: center;
  display: flex;
  justify-content: space-between;
  flex-direction: ${(props) => (props.platform === 'darwin' ? 'row-reverse' : 'row')};
  /* background: var(--ghostB); */
  border-radius: 12px;
  background: var(--ghostAZ);
  /* border-bottom-left-radius: 16px;
  border-top-left-radius: 0px;
  border-bottom-right-radius: 16px;
  border-top-right-radius: 0px; */
  /* box-shadow: 0px 4px 18px var(0, 0, 30, 0.6); */
  transition: all 2s ease-in-out;
  transform: translate3d(0, 0px, 0);
`

const RibbonSection = styled.div`
  height: 32px;
  border-radius: 16px;
  overflow: hidden;
  z-index: 999999;
  background: var(--ghostA);

  opacity: 1;
  /* border-bottom: 2px solid var(--ghostAZ); */
  /* box-shadow: 0px 2px 8px -2px var(--ghostY), 0px -3px 6px -2px var(--ghostB); */
  display: flex;
  margin: 0 auto;
  /* -webkit-app-region: no-drag; */
`

const Options = styled.div`
  font-size: 13px;
  font-weight: 400;
  display: flex;
  height: 100%;
`
const OptionButton = styled.div`
  width: 48px;
  height: 100%;
  border-left: 1px solid var(--ghostAZ);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
  * {
    pointer-events: none;
  }
  &:hover {
    background: var(--ghostC);
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
  display: none;

  &:after {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
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
  bottom: 0px;
  left: 0px;
  height: 120px;
  z-index: 199999;
  pointer-events: none;
  display: none;
  /* background: red; */
  background: linear-gradient(-180deg, var(--ghostAZ) 0%, transparent 100%);

  &:after {
    content: '';
    position: absolute;
    inset: 0px;
    opacity: 0.8;
    background: linear-gradient(-180deg, var(--ghostAZ) 25%, transparent 100%);
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

// const RibbonCenter = styled.div`
//   /* display: flex;
//   margin: 2px 0px 0px 0px;
//   > * {
//     margin: 0 8px;
//   } */
// `

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

const fadeIn = keyframes`
  0% {
    transform: translate3d(0, 0px, 0);
  }
  100% {
    transform: translate3d(0, -90px, 0);
  }
`

const RibbonContainer = styled.div`
  position: absolute;
  top: 0px;
  right: 0px;
  left: 0px;
  height: 64px;
  transform: translate3d(0, 0, 0);
  /* animation-delay: 0.5s; */
  /* animation: ${fadeIn} 2s ease-in-out alternate infinite; */
  z-index: 99999999;
  -webkit-app-region: drag;
  display: flex;
  justify-content: center;
  align-items: center;
`

// const RoundedElement = styled.div`
//   position: absolute;
//   left: 8px;
//   bottom: -5px;

//   width: 5px;
//   height: 5px;
//   background-color: var(--ghostAZ); /* Your actual background color */

//   /* The mask */
//   -webkit-mask-box-image: radial-gradient(circle at bottom right, transparent 0% 5px, black 5px);
//   mask-box-image: radial-gradient(circle at bottom right, transparent 0% 5px, black 5px);
// `

// const RoundedElementRight = styled.div`
//   position: absolute;
//   right: 8px;
//   bottom: -5px;

//   width: 5px;
//   height: 5px;
//   background-color: var(--ghostAZ); /* Your actual background color */

//   /* The mask */
//   -webkit-mask-box-image: radial-gradient(circle at bottom left, transparent 0% 5px, black 5px);
//   mask-box-image: radial-gradient(circle at bottom left, transparent 0% 5px, black 5px);
// `

export default () => {
  const frameState = useStore('windows.workspaces', frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null

  const { space } = nav

  const platform = useStore('platform')

  return (
    <>
      {/* <GlobalStyle /> */}
      <RibbonContainer>
        <Ribbon platform={platform}>
          {/* <RoundedElement />
          <RoundedElementRight /> */}
          {/* <Navigation platform={platform} /> */}

          <RibbonSection>
            <Account />
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
                {svg.route(14)}
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

          <Native platform={platform} />
        </Ribbon>
        {/* <TopBackdrop />
        <TopFade /> */}
      </RibbonContainer>
    </>
  )
}
