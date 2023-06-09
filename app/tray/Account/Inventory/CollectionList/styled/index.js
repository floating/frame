import styled, { keyframes } from 'styled-components'

const wave = keyframes`
  0% { 
    transform: translate(0, 0);
  }
  50% {
    transform: translate(1px, 2px);
  }
  100% { 
    transform: translate(0, 0);
  }
`

export const CollectionInner = styled.div`
  position: relative;
  height: 65px;
  transition: all linear 0.8s;
`

export const CollectionIcon = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
`

export const CollectionMain = styled.div`
  position: absolute;
  display: flex;
  justify-content: space-between;
  align-items: center;
  inset: 30px 20px 12px 66px;
`

export const CollectionLine = styled.div`
  background: var(--ghostY);
  height: 1px;
  margin: 0px 12px 0px 6px;
  flex: 1;
  position: relative;
`

export const CollectionDot = styled.div`
  display: flex;
  height: 16px;
  width: 16px;
  min-height: 16px;
  min-width: 16px;
  margin-right: 6px;
  border-radius: 4px;
  transition: var(--standard);
  overflow: hidden;
  justify-content: center;
  position: relative;
  font-family: 'FiraCode';
  font-size: 10px;
  border: 1px solid var(--ghostB);
  background: var(--ghostB);
  box-shadow: 0px 1px 2px var(--ghostY);
  z-index: 10;
  img {
    margin: -1px;
    object-fit: cover;
    position: relative;
    z-index: 10;
  }
  img:before {
    content: attr(alt);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    background: var(--ghostB);
    color: var(--outerspace);
    color: transparent;
  }
`

export const CollectionDots = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  transition: var(--standardFast);
`

export const CollectionCount = styled.div`
  display: flex;
  height: 20px;
  min-height: 20px;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-family: 'FiraCode';
  padding-left: 4px;
`
