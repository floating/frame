import styled, { css } from 'styled-components'

import svg from '../../../../../../resources/svg'

const OriginPermissionToggleSwitch = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  bottom: 2px;
  width: 16px;
  border-radius: 10px;
  transition: var(--standard);
  background: var(--ghostC);
  transform: translateZ(0);
  pointer-events: none;
  border-bottom: 2px solid var(--ghostZ);
`

const OriginPermissionToggleSwitchLocked = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;

  ${OriginPermissionToggleSwitch} {
    opacity: 1;
    transition: var(--standard);
  }

  svg {
    transition: var(--standard);
    color: var(--ghostC);
  }
`

const OriginPermissionToggle = styled.div`
  position: relative;
  background: var(--bad);
  height: 20px;
  width: 40px;
  margin-right: 6px;
  margin-left: 12px;
  margin-top: 4px;
  border-radius: 10px;
  transition: var(--standard);
  transform: translateZ(0);
  cursor: pointer;
  min-width: 40px;

  * {
    pointer-events: none;
  }

  ${OriginPermissionToggleSwitch} {
    background: var(--ghostD);
  }

  &:hover {
    ${OriginPermissionToggleSwitch} {
      opacity: ${({ isLocked }) => (isLocked ? 0 : 1)};
      transition: ${({ isLocked }) => (isLocked ? 'var(--standardFast)' : 'var(--standard)')};
    }
    ${OriginPermissionToggleSwitchLocked} {
      opacity: ${({ isLocked }) => (isLocked ? 1 : 0)};
      transition: var(--standardFast);
    }
  }

  ${(props) =>
    props.isOn &&
    css`
      background: var(--good);

      ${OriginPermissionToggleSwitch} {
        position: absolute;
        transform: translateX(20px);
      }
    `}
`

export const OriginToggle = ({ isOn, isLocked, onClick }) => {
  return (
    <OriginPermissionToggle isOn={isOn} isLocked={isLocked} onClick={isLocked ? null : onClick}>
      <OriginPermissionToggleSwitchLocked>{svg.lock(10)}</OriginPermissionToggleSwitchLocked>
      <OriginPermissionToggleSwitch />
    </OriginPermissionToggle>
  )
}
