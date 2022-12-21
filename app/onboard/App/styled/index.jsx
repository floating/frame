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
  top: 32px;
  right: 0;
  bottom: 52px;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const Slide = styled.div`
  position: relative;
  width: 500px;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  z-index: 700;
`

export const SlideTitle = styled.div`
  font-size: 30px;
  font-weight: 400;
  animation: cardShow 400ms linear both;
  animation-delay: 0s;
`

export const SlideBody = styled.div`
  animation: cardShow 400ms linear both;
  animation-delay: 200ms;
  div {
    padding-top: 30px;
  }
`

export const Proceed = styled.div`
  width: 200px;
  height: 60px;
  border-radius: 20px;
  background: var(--ghostB);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: cardShow 400ms linear both;
  animation-delay: 400ms;
  margin-top: 30px;
  cursor: pointer;
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
