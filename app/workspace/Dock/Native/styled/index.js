import styled, { css } from 'styled-components'

export const NativeControls = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 37px;
  /* border-bottom: 1px solid var(--ghostZ); */
`

export const MacGrab = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  -webkit-app-region: drag;
`

export const MacControls = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 74px;
`

export const LinuxGrab = styled.div`
  position: absolute;
  top: 0;
  right: 104px;
  bottom: 0;
  left: 0;
  -webkit-app-region: drag;
`

export const LinuxControls = styled.div`
  position: absolute;
  top: 0px;
  right: 8px;
  bottom: 0;
  display: flex;
`

export const LinuxControlsButton = styled.div`
  width: 21px;
  height: 21px;
  margin: 6px 0px 8px 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.05);
  flex: 1;
  flex-shrink: 0;

  svg {
    position: relative;
    fill: currentColor;
    transform: scale(0.7);
  }

  * {
    pointer-events: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

export const WindowsGrab = styled.div`
  position: absolute;
  top: 0;
  left: 0px;
  bottom: 0;
  right: 136px;
  -webkit-app-region: drag;
`

export const WindowsControls = styled.div`
  position: absolute;
  top: 1px;
  right: 1px;
  bottom: 0;
  display: flex;
`

export const WindowsControlsButton = styled.div`
  width: 45px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 4px;

  svg {
    position: relative;
    fill: currentColor;
  }

  * {
    pointer-events: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`

export const MacTitle = styled.div`
  height: 30px;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0px 5px 0px 5px;
  z-index: 50000;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    .titleClose {
      background: #fc615d;
    }

    .titleMin {
      background: #fdbd41;
    }

    .titleFull {
      background: #34c84a;
    }
  }
`

export const MacTitleButton = styled.div`
  height: 30px;
  width: 30px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const TitleClose = styled.div`
  width: 12px;
  height: 12px;
  background: rgba(0, 0, 50, 0.15);
  border-radius: 50%;
  pointer-events: none;
`

export const TitleMin = styled.div`
  width: 12px;
  height: 12px;
  background: rgba(0, 0, 50, 0.15);
  border-radius: 50%;
  pointer-events: none;
`

export const TitleFull = styled.div`
  width: 12px;
  height: 12px;
  background: rgba(0, 0, 50, 0.15);
  border-radius: 50%;
  pointer-events: none;
`
