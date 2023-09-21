import styled, { css } from 'styled-components'

export const NativeControls = styled.div`
  /* position: absolute; */
  left: ${(props) => (props.platform === 'darwin' ? '0' : 'unset')};
  right: ${(props) => (props.platform !== 'darwin' ? '0' : 'unset')};
  /* top: 0px;
  bottom: 0; */
  height: 40px;
  width: 80px;
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

  -webkit-app-region: no-drag;
  cursor: pointer;
  * {
    pointer-events: none;
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
  justify-content: center;
  align-items: center;
`

export const WindowsControlsButton = styled.div`
  width: 45px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  border-radius: 4px;
  -webkit-app-region: no-drag;
  cursor: pointer;
  * {
    pointer-events: none;
  }

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

export const MacTitleButton = styled.div`
  height: 20px;
  width: 20px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const MacTitleClose = styled.div`
  width: 13px;
  height: 13px;
  background: rgba(124, 124, 124, 0.24);
  border-radius: 50%;
  cursor: pointer;
`

export const MacTitleMin = styled.div`
  width: 13px;
  height: 13px;
  background: rgba(124, 124, 124, 0.24);
  border-radius: 50%;
  cursor: pointer;
`

export const MacTitleFull = styled.div`
  width: 13px;
  height: 13px;
  background: rgba(124, 124, 124, 0.24);
  border-radius: 50%;
  cursor: pointer;

  /* &:hover {
    background: #34c84a;
  } */
`
export const MacControls = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: no-drag;

  &:hover {
    ${MacTitleClose} {
      background: #fc615d;
    }

    ${MacTitleMin} {
      background: #fdbd41;
    }

    ${MacTitleFull} {
      background: #34c84a;
    }
  }

  ${({ focused }) =>
    focused &&
    `
    ${MacTitleClose} {
      background: #fc615d;
    }

    ${MacTitleMin} {
      background: #fdbd41;
    }

    ${MacTitleFull} {
      background: #34c84a;
    }
  `}
`
