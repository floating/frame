import { z } from 'zod'

const privacySettings = z.enum(['errorReporting'])

export const PrivacySchema = z.record(privacySettings, z.boolean())
