import { forwardRef } from 'react'

const Component = (props = {}, ref = {}) => <svg ref={ref} {...props} />

export const ReactComponent = forwardRef(Component)

export default 'file.svg'
