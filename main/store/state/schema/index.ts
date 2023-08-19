import { z } from 'zod'

import main from './main'
import tray from './tray'
import windows from './windows'
import platform from './platform'
import keyboardLayout from './keyboardLayout'

const State = z.object({
  main,
  tray,
  windows,
  platform,
  keyboardLayout
})

export default State
