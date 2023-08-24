import { z } from 'zod'

import main from './main'
import tray from './tray'
import windows from './windows'
import panel from './panel'
import selected from './selected'
import platform from './platform'
import keyboardLayout from './keyboardLayout'

const State = z.object({
  main,
  tray,
  windows,
  panel,
  selected,
  platform,
  keyboardLayout
})

export default State
