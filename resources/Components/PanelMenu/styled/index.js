import styled from 'styled-components'

export const PanelMenu = styled.div`
  position: absolute;
  left: 8px;
  right: 8px;
  top: 0px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  -webkit-app-region: no-drag;
  z-index: 1000000000;
  opacity: 1;
  transform: translate3d(0, 0, 0);
`

export const PanelMenuGroup = styled.div`
  display: flex;
  height: 100%;
  /* justify-content: space-between;
  align-items: center; */
`

export const PanelMenuItem = styled.div`
  height: 38px;
  /* width: 48px; */
  flex: 1;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: no-drag;
  transition: none;
  pointer-events: auto;
  transform: translate3d(0, 0, 0);
  background: var(--ghostB);
  cursor: pointer;
  border: 3px solid var(--ghostZ);
  margin: 0px 4px;

  * {
    pointer-events: none;
  }

  &:hover {
    background: var(--ghostC);
  }

  &:active {
    background: var(--ghostC);
  }
`

export const PanelTitle = styled.div`
  position: absolute;
  left: 60px;
  right: 170px;
  top: 24px;
  bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'MainFont';
  font-size: 18px;
  font-weight: 300;
  display: none;
`

export const MainWindowMarker = styled.div`
  position: absolute;
  left: 9px;
  top: 10px;
  height: 3px;
  background: var(--ghostZ);
  border-radius: 2px;
  z-index: 20000;
  cursor: pointer;
  width: 50px;
`
