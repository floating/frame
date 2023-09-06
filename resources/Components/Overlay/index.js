import styled from 'styled-components'

const Overlay = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(-35deg, var(--overlayA) 0%, var(--overlayB) 100%);
  z-index: 1000000000;
  pointer-events: none;
`

export default Overlay
