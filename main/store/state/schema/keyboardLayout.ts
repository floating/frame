import { z } from 'zod'
import { schemaWithEmptyDefaults } from './util'

const layout = z.object({
  isUS: z.boolean().default(true)
})

export default schemaWithEmptyDefaults(layout)
