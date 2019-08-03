import { colors, transitions } from '../style.js'

const style = {
  container: {
    common: {
      height: '26px',
      borderRadius: '13px',
      letterSpacing: '1px',
      fontWeight: '400',
      width: '113px',
      padding: '0px 0px 0px 0px',
      fontSize: '13px',
      textTransform: 'uppercase',
      background: colors.highlight,
      flexDirection: 'column',
      overflow: 'hidden',
      transition: transitions.standard,
      boxShadow: '0px 1px 1px rgba(0, 34, 32, 0.1)',
      transform: 'translateZ(0)',
      position: 'relative'
    },
    expanded: {
      height: '101px',
      padding: '18px 0px 18px 0px',
      boxShadow: '0px 4px 10px thick, 0px 5px 14px -2px thick !important',
    }
  },
  items: {
    position: 'relative',
    transform: 'translateZ(0)',
    transition: transitions.standard
  }
}

export default style
