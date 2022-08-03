import { forwardRef } from 'react'

const Component = (props = {}, ref = {}) => <svg ref={ref} {...props} />

const ReactComponent = forwardRef(Component)

exports = {
  ReactComponent,
  default: 'file.svg'
}
