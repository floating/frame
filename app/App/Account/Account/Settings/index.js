import React from 'react'
import Restore from 'react-restore'

import SettingsPreview from './SettingsPreview'
import SettingsExpanded from './SettingsExpanded'

class Dapp extends React.Component {
  render() {
    return this.props.expanded ? <SettingsExpanded {...this.props} /> : <SettingsPreview {...this.props} />
  }
}

export default Restore.connect(Dapp)
