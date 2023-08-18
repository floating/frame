import { z } from 'zod'

import { v37 as v37RateSchema } from './rate'

// asset id -> currency symbol -> rate
const v37 = z
  .record(z.record(v37RateSchema))
  .default({})
  .catch({})
  // rates are never persisted
  .transform(() => ({}))

const latest = v37

export { v37, latest }
