import styled from 'styled-components'

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

export const SlideContainer = styled.div`
  position: absolute;
  top: 32px;
  right: 0;
  bottom: 0;
  left: 0;
  border-top: 1px solid var(--ghostX);
`

export const SlideScroller = styled.div`
  position: relative;
  height: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0px 16px 0px;
  box-sizing: border-box;
`

export const Slide = styled.div`
  position: relative;
  width: 100%;
  z-index: 700;
  max-height: 100%;
  box-sizing: border-box;
  overflow-y: scroll;
  overflow-x: hidden;
`

export const SlideItem = styled.div`
  display: 'flex';
  flex-direction: column;
  div {
    padding-bottom: 0px;
  }
`

export const SlideBody = styled.div`
  max-width: 500px;
  animation: cardShow 400ms linear both;
  animation-delay: 200ms;
  font-weight: 300;
  font-size: 18px;
  margin: auto;
  text-align: center;
  @media (max-height: 768px) {
    font-size: 14px;
  }
  ${SlideItem} {
    padding-bottom: 30px;
    line-height: 30px;
  }
  ${SlideItem}:last-child {
    padding-bottom: 0px;
  }
`
export const SlideVideo = styled.div`
  font-size: 32px;
  font-weight: 500;
  animation: cardShow 400ms linear both;
  overflow: hidden;
  margin: 25px auto;
  border-radius: 6px;
  height: 240px;
  width: 390px;
  box-shadow: 0px 8px 24px var(--ghostX), 0px -4px 8px var(--ghostY);

  video {
    height: 100%;
  }
`

export const SlideTitle = styled.div`
  font-size: 32px;
  font-weight: 500;
  animation: cardShow 400ms linear both;
  animation-delay: 0s;
  height: 20%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
`

export const SlideProceed = styled.div`
  height: 40%;
  display: flex;
  justify-content: center;
`

export const Shortcut = styled.span`
  padding: 4px 19px 5px 19px;
  height: 42px;
  border-radius: 21px;
  font-weight: 400;
  font-size: 14px;
  border: 2px solid var(--moon);
  margin: 6px;
`

export const Tag = styled.span`
  padding: 2px 8px;
  height: 40px;
  border-radius: 4px;
  background: var(--outerspace);
  color: var(--ghostZ);
  margin: 4px;
`

export const PylonConfirm = styled.div`
  display: flex;
  /* justify-content: center; */
  align-items: center;
  flex-direction: column;
  /* position: absolute;
  bottom: 0px;
  left: 0px;
  right: 0px;
  
  padding-bottom: 20px; */
  font-size: 32px;
  font-weight: 500;
  animation: cardShow 400ms linear both;
  animation-delay: 0s;
  height: 30%;
  /* display: flex;
  justify-content: center;
  align-items: flex-end; */
`
export const PylonConfirmButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 240px;
  height: 40px;
  cursor: pointer;
  border-radius: 20px;
  border: 2px solid var(--ghostY);
  box-sizing: border-box;
  text-transform: uppercase;
  background: var(--ghostAZ);
  font-size: 16px;
  font-weight: 400;
  transform: translateY(0px);

  box-shadow: 0px 3px 6px var(--ghostX);
  transition: var(--standardFast);
  * {
    pointer-events: none;
  }
  &:first-child {
    margin-bottom: 10px;
  }

  &:hover {
    background: var(--ghostA);
    transform: translateY(-1px);
    color: var(--mint);
    box-shadow: 0px 4px 12px var(--ghostX);
  }

  &:active {
    background: var(--ghostA);
    transform: translateY(1px);
    color: var(--mint);
    box-shadow: 0px 1px 2px var(--ghostX);
  }
`

export const PylonConfirmButtonSub = styled(PylonConfirmButton)`
  font-size: 10px;
  width: 180px;
  height: 30px;
  border-radius: 52px;
  box-shadow: 0px 1px 2px var(--ghostX);
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
