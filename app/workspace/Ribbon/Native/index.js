import React from 'react'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'
import useStore from '../../../../resources/Hooks/useStore.js'
import styled from 'styled-components'
import {
  NativeControls,
  LinuxControls,
  LinuxControlsButton,
  WindowsControls,
  WindowsControlsButton,
  MacControls,
  MacTitleButton,
  MacTitleClose,
  MacTitleMin,
  MacTitleFull
} from './styled'

const NavigationContainer = styled.div`
  position: absolute;
  top: 0px;
  left: 8px;
  bottom: 0px;
  z-index: 9999;
  display: flex;
  background: red;
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
  background: red;
  -webkit-app-region: no-drag;
  &:hover {
    background: var(--ghostB);
    box-shadow: 1px 1px 4px var(--ghostZ), -1px -1px 4px var(--ghostA);
  }
  * {
    pointer-events: none;
  }
`

const RotatedSpan = styled.span`
  transform: rotate(180deg);
`

const Navigation = () => (
  <NavigationContainer>
    <NavBack onClick={() => link.send('workspace:nav:back', window.frameId)}>{svg.chevronLeft(14)}</NavBack>
    <NavBack onClick={() => link.send('workspace:nav:forward', window.frameId)}>
      <RotatedSpan>{svg.chevronLeft(14)}</RotatedSpan>
    </NavBack>
  </NavigationContainer>
)

const handleClose = () => link.send('frame:close')
const handleMin = () => link.send('frame:min')
const handleMax = () => link.send('frame:max')
const handleUnmax = () => link.send('frame:unmax')
const handleFull = () => link.send('frame:full')
const handleUnfull = () => link.send('frame:unfull')

const Title = () => {
  const platform = useStore('platform')
  const { fullscreen, maximized, focused } = useStore('windows.workspaces', window.frameId)

  return (
    <NativeControls>
      {/* <Navigation platform={platform} /> */}
      {platform === 'darwin' ? (
        <MacControls focused={focused}>
          <MacTitleButton>
            <MacTitleClose onClick={handleClose}></MacTitleClose>
          </MacTitleButton>
          <MacTitleButton>
            <MacTitleMin onClick={handleClose}></MacTitleMin>
          </MacTitleButton>
          <MacTitleButton>
            {maximized || fullscreen ? (
              <MacTitleFull onClick={handleUnfull}></MacTitleFull>
            ) : (
              <MacTitleFull onClick={handleFull}></MacTitleFull>
            )}
          </MacTitleButton>
        </MacControls>
      ) : platform === 'win32' ? (
        <>
          <WindowsControls>
            <WindowsControlsButton onClick={handleMin}>
              <svg width='11' height='1' viewBox='0 0 11 1'>
                <path d='m11 0v1h-11v-1z' />
              </svg>
            </WindowsControlsButton>
            {maximized || fullscreen ? (
              <WindowsControlsButton onClick={handleUnfull}>
                <svg width='11' height='11' viewBox='0 0 11 11'>
                  <path d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z' />
                </svg>
              </WindowsControlsButton>
            ) : (
              <WindowsControlsButton onClick={handleFull}>
                <svg width='10' height='10' viewBox='0 0 10 10'>
                  <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' />
                </svg>
              </WindowsControlsButton>
            )}
            <WindowsControlsButton onClick={handleClose}>
              <svg width='12' height='12' viewBox='0 0 12 12'>
                <path d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z' />
              </svg>
            </WindowsControlsButton>
          </WindowsControls>
        </>
      ) : (
        <>
          <LinuxControls>
            <LinuxControlsButton onClick={handleMin}>
              <svg width='11' height='1' viewBox='0 0 11 1'>
                <path d='m11 0v1h-11v-1z' />
              </svg>
            </LinuxControlsButton>
            {maximized || fullscreen ? (
              <LinuxControlsButton onClick={handleUnmax}>
                <svg width='11' height='11' viewBox='0 0 11 11'>
                  <path d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z' />
                </svg>
              </LinuxControlsButton>
            ) : (
              <LinuxControlsButton onClick={handleMax}>
                <svg width='10' height='10' viewBox='0 0 10 10'>
                  <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' />
                </svg>
              </LinuxControlsButton>
            )}
            <LinuxControlsButton onClick={handleClose}>
              <svg width='12' height='12' viewBox='0 0 12 12'>
                <path d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z' />
              </svg>
            </LinuxControlsButton>
          </LinuxControls>
        </>
      )}
    </NativeControls>
  )
}

export default Title
