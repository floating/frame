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
  position: absolute;
  inset: 0px;
  z-index: 99999999999;
  /* transition: var(--standard); */
  /* opacity: ${({ active }) => (active ? 1 : 0)}; */
  pointer-events: none;

  * {
    pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  }
`

export const AccountManagerMain = styled.div`
  position: absolute;
  left: 8px;
  right: 8px;
  top: 140px;
  bottom: 40px;
  border-radius: 28px;
  overflow-x: hidden;
  overflow-y: scroll;
  /* padding: 20px; */
  /* backdrop-filter: blur(16px); */
  background: var(--ghostZ);
  transition: var(--standardFast);
  pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  opacity: ${({ active }) => (active ? '1' : '0')};
  /* box-shadow: 0px 0px 16px var(--ghostY); */
  /* animation: ${({ active, isExiting }) =>
    (active || isExiting) &&
    (isExiting
      ? css`
          ${cardDown} 400ms linear both
        `
      : css`
          ${cardUp} 400ms linear both
        `)}; */

  * {
    pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
  }

  ${(props) => {
    return (
      props.grabbing &&
      css`
        cursor: grabbing !important;
        * {
          cursor: grabbing !important;
        }
      `
    )
  }};
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
