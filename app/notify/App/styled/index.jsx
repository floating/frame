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

export const Container = styled.div`
  position: absolute;
  top: 32px;
  right: 0;
  bottom: 0;
  left: 0;
  border-top: 1px solid var(--ghostX);
  overflow-y: scroll;
`

export const Item = styled.div`
  display: 'flex';
  flex-direction: column;
  div {
    padding-bottom: 0px;
  }
`

export const Body = styled.div`
  max-width: 500px;
  animation: cardShow 400ms linear both;
  animation-delay: 200ms;
  font-weight: 300;
  font-size: 15px;
  padding: 8px;
  margin: auto;
  text-align: center;
  ${Item} {
    padding-bottom: 20px;
    line-height: 20px;
  }
  ${Item}:last-child {
    padding-bottom: 0px;
  }
`

export const Title = styled.div`
  font-size: 24px;
  font-weight: 400;
  animation: cardShow 400ms linear both;
  animation-delay: 0s;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const PylonConfirm = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 160px;
  font-size: 32px;
  font-weight: 500;
  animation: cardShow 400ms linear both;
  animation-delay: 0s;
`
export const PylonConfirmButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 240px;
  height: 40px;
  cursor: pointer;
  border-radius: 20px;
  box-sizing: border-box;
  text-transform: uppercase;
  background: var(--ghostA);
  font-size: 16px;
  font-weight: 400;
  transform: translateY(0px);
  box-shadow: 0px 4px 4px -2px var(--ghostX);
  transition: var(--standardFast);
  * {
    pointer-events: none;
  }
  &:first-child {
    margin-bottom: 10px;
  }

  &:hover {
    background: var(--ghostB);
    transform: translateY(-1px);
    color: var(--mint);
    box-shadow: 0px 6px 6px -3px var(--ghostX);
  }

  &:active {
    background: var(--ghostB);
    transform: translateY(1px);
    color: var(--mint);
    box-shadow: 0px 2px 2px -1px var(--ghostX);
  }
`

export const PylonConfirmButtonSub = styled(PylonConfirmButton)`
  font-size: 10px;
  width: 180px;
  height: 30px;
  border-radius: 52px;
  box-shadow: 0px 1px 2px var(--ghostX);
`
