import styled, { keyframes } from 'styled-components'

export const Onboard = styled.div`
  position: absolute;
  top: 0px;
  right: 0;
  bottom: 0;
  left: 0;
  color: var(--outerspace);
  background: var(--ghostZ);
  font-family: 'MainFont';
  font-size: 20px;
  overflow: hidden;
`

export const DevControls = styled.div`
  position: absolute;
  right: 0px;
  bottom: 0px;
  color: var(--outerspace);
  display: flex;
  font-size: 12px;
  z-index: 20000;
  &:after {
    content: 'developer nav';
    position: absolute;
    top: -20px;
    left: 0px;
  }
`

export const DevControlButton = styled.div`
  padding: 10px 20px;
  background: var(--ghostB);
  border-radius: 8px;
  margin-right: 20px;
  margin-bottom: 20px;
  cursor: pointer;
`

export const SlideContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 64px 0px;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const Slide = styled.div`
  position: relative;
  width: 100%;
  padding: 64px 96px;
  max-width: 408px;
  z-index: 700;
  max-height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
`

export const SlideTitle = styled.div`
  font-size: 32px;
  font-weight: 500;
  animation: cardShow 400ms linear both;
  animation-delay: 0s;
  margin-bottom: 20px;
`

export const SlideBody = styled.div`
  animation: cardShow 400ms linear both;
  animation-delay: 200ms;
  font-weight: 300;
  font-size: 18px;
  div {
    padding-top: 40px;
    line-height: 40px;
  }
`

export const Shortcut = styled.span`
  animation: cardShow 400ms linear both;
  animation-delay: 200ms;
  padding: 4px 19px 5px 19px;
  height: 42px;
  border-radius: 21px;
  font-weight: 400;
  font-size: 14px;
  border: 2px solid var(--moon);
  margin: 6px;
`

export const Proceed = styled.div`
  width: 180px;
  height: 48px;
  border-radius: 24px;
  background: var(--ghostA);
  border-bottom: 2px solid var(--ghostZ);
  box-shadow: 0px 2px 6px var(--ghostY);
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  animation: cardShow 400ms linear both;
  animation-delay: 400ms;
  margin-top: 60px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background: var(--ghostB);
  }
`

export const Skip = styled.span`
  display: inline-block;
  height: 32px;
  font-size: 10px;
  border-radius: 16px;
  border: 2px solid var(--ghostX);
  padding: 8px 16px;
  box-sizing: border-box;
  animation: cardShow 400ms linear both;
  animation-delay: 400ms;
  margin-top: 60px;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  color: var(--outerspace08);
  &:hover {
    color: var(--outerspace);
  }
`

// const cardShow = keyframes`
//   0% { opacity: 0; }
//   15.82% {
//     opacity: 0;
//     transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -9.026, 0, 0, 1);
//   }
//   21.02% {
//     transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -19.292, 0, 0, 1);
//   }
//   35.34% {
//     transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -3.681, 0, 0, 1);
//   }
//   49.55% {
//     opacity: 1;
//     transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2.594, 0, 0, 1);
//   }
//   78.18% {
//     transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.018, 0, 0, 1);
//   }
//   100% {
//     transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
//   }
// `
