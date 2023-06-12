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
  background: var(--ghostB);
`

export const CollectionMedia = styled.div`
  height: 100px;
  width: 100px;
  object-fit: contain;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  z-index: 2;
  box-shadow: 0px 5px 10px var(--ghostY);
  border: 6px solid var(--ghostB);
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
