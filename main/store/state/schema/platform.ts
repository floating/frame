import { z } from 'zod'

const platform = z.string().catch(process.platform).default(process.platform)

export default platform
