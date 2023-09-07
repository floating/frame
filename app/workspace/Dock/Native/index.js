import React from 'react'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'
import useStore from '../../../../resources/Hooks/useStore.js'
import styled from 'styled-components'

import { NativeControls } from './styled'

const NavigationContainer = styled.div`
  position: absolute;
  top: 0px;
  right: 8px;
  bottom: 0px;
  z-index: 9999;
  display: flex;
`
const NavBack = styled.div`
  height: 26px;
  width: 26px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  /* border-left: 1px solid var(--ghostZ); */
  margin: 8px 0px;
  border-radius: 7px;
  -webkit-app-region: no-drag;
  /* background: var(--ghostZ); */
  &:hover {
    background: var(--ghostB);
    box-shadow: 1px 1px 4px var(--ghostZ), -1px -1px 4px var(--ghostA);
  }
  * {
    pointer-events: none;
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

const Title = () => {
  const handleClose = () => {
    link.send('frame:close')
  }

  const handleMin = () => {
    link.send('frame:min')
  }

  const handleMax = () => {
    link.send('frame:max')
  }

  const handleUnmax = () => {
    link.send('frame:unmax')
  }

  const handleFull = () => {
    link.send('frame:full')
  }

  const handleUnfull = () => {
    link.send('frame:unfull')
  }

  const platform = useStore('platform')
  const { fullscreen, maximized } = useStore('windows.workspaces', window.frameId)

  return (
    <NativeControls>
      <Navigation platform={platform} />
      {platform === 'darwin' ? (
        <>
          {/* <div className='macGrab' /> */}
          <div className='macControls'></div>
        </>
      ) : platform === 'win32' ? (
        <>
          {/* <div className='windowsGrab' /> */}
          <div className='windowsControls'>
            <div className='windowsControlsButton' onClick={handleMin}>
              <svg width='11' height='1' viewBox='0 0 11 1'>
                <path d='m11 0v1h-11v-1z' />
              </svg>
            </div>
            {maximized || fullscreen ? (
              <div className='windowsControlsButton' onClick={handleUnmax}>
                <svg width='11' height='11' viewBox='0 0 11 11'>
                  <path d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z' />
                </svg>
              </div>
            ) : (
              <div className='windowsControlsButton' onClick={handleMax}>
                <svg width='10' height='10' viewBox='0 0 10 10'>
                  <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' />
                </svg>
              </div>
            )}
            <div className='windowsControlsButton' onClick={handleClose}>
              <svg width='12' height='12' viewBox='0 0 12 12'>
                <path d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z' />
              </svg>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* <div className='linuxGrab' /> */}
          <div className='linuxControls'>
            <div className='linuxControlsButton' onClick={handleMin}>
              <svg className='linuxControlsMin' width='11' height='1' viewBox='0 0 11 1'>
                <path d='m11 0v1h-11v-1z' />
              </svg>
            </div>
            {maximized || fullscreen ? (
              <div className='linuxControlsButton' onClick={handleUnmax}>
                <svg className='linuxControlsMax' width='11' height='11' viewBox='0 0 11 11'>
                  <path d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z' />
                </svg>
              </div>
            ) : (
              <div className='linuxControlsButton' onClick={handleMax}>
                <svg className='linuxControlsMax' width='10' height='10' viewBox='0 0 10 10'>
                  <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' />
                </svg>
              </div>
            )}
            <div className='linuxControlsButton' onClick={handleClose}>
              <svg className='linuxControlsClose' width='12' height='12' viewBox='0 0 12 12'>
                <path d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z' />
              </svg>
            </div>
          </div>
        </>
      )}
    </NativeControls>
  )
}

export default Title
