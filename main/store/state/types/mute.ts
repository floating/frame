import { z } from 'zod'

const notificationTypes = z.enum([
  'alphaWarning',
  'welcomeWarning',
  'externalLinkWarning',
  'explorerWarning',
  'signerRelockChange',
  'gasFeeWarning',
  'betaDisclosure',
  'onboardingWindow',
  'signerCompatibilityWarning',
  'migrateToPylon'
])

export const MuteSchema = z.record(notificationTypes, z.boolean())
