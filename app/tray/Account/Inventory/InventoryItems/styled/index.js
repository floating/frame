import styled, { keyframes } from 'styled-components'

export const pulsate = keyframes`
  0% { transform: scale(1) }
  100% { transform: scale(3) }
`
export const PulsateCircle = styled.div`
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--ghostZ);
  animation: ${pulsate} 1.4s ease-in-out infinite alternate;
  animation-delay: ${(props) => (props.index || 0) * 0.3 + 's'};
  transform: translate3d(0, 0, 1px);
`

export const InventoryPreview = styled.div`
  position: absolute !important;
  top: 42px;
  left: 0px;
  right: 0px;
  bottom: 12px;
`

export const PreviewDisplay = styled.div`
  position: relative;
  width: 100%;
  height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 26px;
    overflow: hidden;
  }

  img:before {
    content: attr(alt);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--ghostA);
    color: var(--outerspace);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 17px;
    font-weight: 300;
    letter-spacing: -0.5px;
    margin-left: -0.5px;
    font-family: 'VCR';
  }
`

export const PreviewOptions = styled.div`
  position: relative;
  width: 100%;
  height: 31px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'VCR';
  font-size: 14px;
  text-transform: uppercase;
`

export const Container = styled.div`
  height: calc(100% - 325px);
`
