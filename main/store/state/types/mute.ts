import { z } from 'zod'

const notificationTypes = [
  'alphaWarning',
  'welcomeWarning',
  'externalLinkWarning',
  'explorerWarning',
  'signerRelockChange',
  'gasFeeWarning',
  'betaDisclosure',
  'onboardingWindow',
  'signerCompatibilityWarning'
] as const

const v37 = z.record(z.enum(notificationTypes), z.boolean().default(false))
const v38 = z.record(z.enum([...notificationTypes, 'migrateToPylon']), z.boolean().default(false))

const latest = v38

export { v37, v38, latest }
