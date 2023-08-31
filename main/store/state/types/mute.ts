import log from 'electron-log'
import { z } from 'zod'

const v37 = z.object({
  alphaWarning: z.boolean().default(false),
  welcomeWarning: z.boolean().default(false),
  externalLinkWarning: z.boolean().default(false),
  explorerWarning: z.boolean().default(false),
  signerRelockChange: z.boolean().default(false),
  gasFeeWarning: z.boolean().default(false),
  betaDisclosure: z.boolean().default(false),
  onboardingWindow: z.boolean().default(false),
  signerCompatibilityWarning: z.boolean().default(false)
})

const v38 = v37.extend({
  migrateToPylon: z.boolean().default(true)
})

const latestSchema = v38

const latest = latestSchema
  .catch((ctx) => {
    log.error('Could not parse mute settings, falling back to defaults', ctx.error)
    return latestSchema.parse({})
  })
  .default({})

export { v37, v38, latest }
