import styled, { keyframes, css } from 'styled-components'

export const cardUp = keyframes`
  0% {
    opacity: 0;
  }
  15.82% {
    opacity: 0;
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -9.026, 0, 1);
  }
  21.02% {
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -19.292, 0, 1);
  }
  35.34% {
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -3.681, 0, 1);
  }
  49.55% {
    opacity: 1;
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2.594, 0, 1);
  }
  78.18% {
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -0.018, 0, 1);
  }
  100% {
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
`

export const cardDown = keyframes`
  0% {
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
  100% {
    opacity: 0;
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -9.026, 0, 1);
  }
`

export const AccountManagerWrap = styled.div`
  z-index: 99999999999;
  pointer-events: none;
  /* animation: cardShow 400ms linear both; */
  * {
    pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  }
`

export const AccountManagerMain = styled.div`
  background: var(--ghostZ);
  transition: var(--standardFast);
  pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  opacity: ${({ active }) => (active ? '1' : '0')};

  * {
    pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  }
`

export const Group = styled.div`
  border: 1px solid #ddd;
  margin-bottom: 15px;
  padding: 5px;
`

export const GroupTitle = styled.h2`
  margin: 0 0 10px 0;
`

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

export const ListItem = styled.li`
  border: 1px solid #000;
  margin-bottom: 10px;
  padding: 10px;
`

export const Debug = styled.div`
  position: absolute;
  z-index: 9999999999;
  pointer-events: none;
  background: black;
  * {
    pointer-events: none;
  }
`

export const Copy = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  cursor: pointer;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  * {
    pointer-events: none;
  }
`

export const GroupHeader = styled.div`
  display: flex;
  position: relative;
  padding: 16px 16px;
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: -8px;
  align-items: center;
`

export const GroupExpand = styled.div`
  height: 20px;
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: var(--standard);
  transform: ${({ expanded }) => (expanded ? 'rotate(180deg)' : 'rotate(90deg)')};
  * {
    pointer-events: none;
  }
`
