import { latest as MuteSchema } from '../../../../../main/store/state/types/mute'

const defaultMuteSettings = {
  alphaWarning: false,
  welcomeWarning: false,
  externalLinkWarning: false,
  explorerWarning: false,
  signerRelockChange: false,
  gasFeeWarning: false,
  betaDisclosure: false,
  onboardingWindow: false,
  signerCompatibilityWarning: false,
  migrateToPylon: true
}

it('uses default settings for an empty state', () => {
  expect(MuteSchema.parse(undefined)).toStrictEqual(defaultMuteSettings)
})

it('uses default settings for a corrupt state', () => {
  expect(MuteSchema.parse([])).toStrictEqual(defaultMuteSettings)
})

it('parses existing settings', () => {
  const settings = {
    ...defaultMuteSettings,
    gasFeeWarning: true,
    onboardingWindow: true
  }

  expect(MuteSchema.parse(settings)).toStrictEqual(settings)
})
